import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import Stripe from "stripe";
import WebSocket from "ws";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  loginSchema,
  registerSchema,
  insertProjectSchema,
  insertMessageSchema,
  insertReviewSchema,
  subscriptionTierEnum,
} from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    })
  : null;

// Subscription prices (Stripe price IDs)
const SUBSCRIPTION_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC || "price_basic",
  pro: process.env.STRIPE_PRICE_PRO || "price_pro",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise",
};

// Setup session store
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "projectpro-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Invalid email or password" });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return done(null, false, { message: "Invalid email or password" });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to handle Zod validation errors
  const validateRequest = (schema: any) => (
    req: Request,
    res: Response,
    next: any
  ) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedError = fromZodError(error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: formattedError.details
        });
      }
      next(error);
    }
  };

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthenticated" });
  };

  const isProvider = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated() && (req.user as any).role === "provider") {
      return next();
    }
    res.status(403).json({ message: "Unauthorized. Provider role required." });
  };

  // Auth routes
  app.post(
    "/api/auth/login",
    validateRequest(loginSchema),
    passport.authenticate("local"),
    (req, res) => {
      res.json({ user: req.user });
    }
  );

  app.post("/api/auth/register", validateRequest(registerSchema), async (req, res) => {
    try {
      const { email, username, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        return res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });
  
  // User settings route
  app.patch("/api/users/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { firstName, lastName, contactPreference, contactValue } = req.body;
      
      // Update user settings
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        contactPreference,
        contactValue
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Subscription routes
  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription((req.user as any).id);
      res.json({ subscription });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const user = req.user as any;
      const { tier } = req.body;
      
      if (!subscriptionTierEnum.enum.includes(tier)) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }

      let customerId = user.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      // Get subscription price ID based on tier
      const priceId = SUBSCRIPTION_PRICES[tier as keyof typeof SUBSCRIPTION_PRICES];

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Store subscription details in database
      const currentDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Assuming monthly billing

      await storage.createSubscription({
        userId: user.id,
        tier: tier as any,
        status: 'active',
        currentPeriodStart: currentDate,
        currentPeriodEnd: endDate,
        cancelAtPeriodEnd: false
      });

      // Update user with stripe subscription ID
      await storage.updateUser(user.id, { 
        stripeSubscriptionId: subscription.id,
      });

      // Send client secret to frontend for payment confirmation
      const invoice = subscription.latest_invoice as any;
      const clientSecret = invoice?.payment_intent?.client_secret;

      res.json({
        subscriptionId: subscription.id,
        clientSecret
      });
    } catch (error) {
      console.error("Create subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post("/api/cancel-subscription", isAuthenticated, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const user = req.user as any;
      const subscription = await storage.getUserSubscription(user.id);

      if (!subscription) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      if (user.stripeSubscriptionId) {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      await storage.updateSubscription(subscription.id, {
        cancelAtPeriodEnd: true,
      });

      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let projectList;

      if (user.role === "provider") {
        projectList = await storage.getProviderProjects(user.id);
      } else {
        projectList = await storage.getUserProjects(user.id);
      }

      res.json({ projects: projectList });
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      const user = req.user as any;
      if (
        project.userId !== user.id &&
        project.providerId !== user.id &&
        user.role !== "admin"
      ) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }

      res.json({ project });
    } catch (error) {
      console.error("Get project error:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, validateRequest(insertProjectSchema), async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user has an active subscription for non-basic tiers
      if (req.body.tier !== 'basic') {
        const subscription = await storage.getUserSubscription(user.id);
        if (!subscription || subscription.status !== 'active') {
          return res.status(403).json({ 
            message: "Active subscription required to create projects" 
          });
        }
      }

      const project = await storage.createProject({
        ...req.body,
        userId: user.id,
      });

      res.status(201).json({ project });
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to update this project
      const user = req.user as any;
      if (
        project.userId !== user.id &&
        project.providerId !== user.id &&
        user.role !== "admin"
      ) {
        return res.status(403).json({ message: "You don't have permission to update this project" });
      }

      // Providers can only update status and attachments
      const allowedUpdates = user.role === "provider" && project.providerId === user.id
        ? ['status', 'attachments']
        : ['title', 'description', 'attachments', 'dueDate'];

      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);

      const updatedProject = await storage.updateProject(projectId, updates);
      res.json({ project: updatedProject });
    } catch (error) {
      console.error("Update project error:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.post("/api/projects/:id/assign", isProvider, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.providerId) {
        return res.status(400).json({ message: "Project already assigned" });
      }

      const providerId = (req.user as any).id;
      const updatedProject = await storage.updateProject(projectId, {
        providerId,
        status: "in_progress",
      });

      res.json({ project: updatedProject });
    } catch (error) {
      console.error("Assign project error:", error);
      res.status(500).json({ message: "Failed to assign project" });
    }
  });

  // Message routes
  app.get("/api/projects/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project's messages
      const user = req.user as any;
      if (
        project.userId !== user.id &&
        project.providerId !== user.id &&
        user.role !== "admin"
      ) {
        return res.status(403).json({ message: "You don't have access to messages for this project" });
      }

      const messages = await storage.getProjectMessages(projectId);
      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/projects/:id/messages", isAuthenticated, validateRequest(insertMessageSchema), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to send messages for this project
      const user = req.user as any;
      if (
        project.userId !== user.id &&
        project.providerId !== user.id &&
        user.role !== "admin"
      ) {
        return res.status(403).json({ message: "You don't have permission to send messages for this project" });
      }

      const message = await storage.createMessage({
        projectId,
        senderId: user.id,
        content: req.body.content,
      });

      res.status(201).json({ message });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Review routes
  app.get("/api/projects/:id/reviews", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const reviews = await storage.getProjectReviews(projectId);
      
      // Filter out hidden reviews for non-authenticated users
      const visibleReviews = req.isAuthenticated() 
        ? reviews 
        : reviews.filter(review => !review.hidden);
        
      res.json({ reviews: visibleReviews });
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/users/:id/reviews", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      // Only include hidden reviews if the requesting user is the review recipient
      const includeHidden = req.isAuthenticated() && (req.user as any).id === userId;
      const reviews = await storage.getUserReviews(userId, includeHidden);
      res.json({ reviews });
    } catch (error) {
      console.error("Get user reviews error:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  app.post("/api/projects/:id/reviews", isAuthenticated, validateRequest(insertReviewSchema), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to review this project
      const user = req.user as any;
      if (project.userId !== user.id && project.providerId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to review this project" });
      }

      // Determine reviewer and receiver
      const reviewerId = user.id;
      const receiverId = user.id === project.userId 
        ? project.providerId 
        : project.userId;

      if (!receiverId) {
        return res.status(400).json({ message: "No recipient found for review" });
      }

      const review = await storage.createReview({
        projectId,
        reviewerId,
        receiverId,
        rating: req.body.rating,
        comment: req.body.comment,
        hidden: false,
      });

      res.status(201).json({ review });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.patch("/api/reviews/:id/toggle-visibility", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const review = await storage.getReview(reviewId);

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Only the review recipient can toggle visibility
      if ((req.user as any).id !== review.receiverId) {
        return res.status(403).json({ message: "You don't have permission to toggle this review" });
      }

      const updatedReview = await storage.toggleReviewVisibility(reviewId);
      res.json({ review: updatedReview });
    } catch (error) {
      console.error("Toggle review visibility error:", error);
      res.status(500).json({ message: "Failed to toggle review visibility" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket server for real-time messages
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Broadcast message to all connected clients
        if (data.type === 'message' && data.projectId) {
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'new-message',
                projectId: data.projectId,
                message: data.message
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
