import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { PROJECT_STATUS } from "@/lib/constants";
import { getProjectReviews, createReview, toggleReviewVisibility, getUserReviews } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, CheckIcon, ClockIcon, FileText, Loader2, StarIcon, EyeIcon, EyeOffIcon } from "lucide-react";

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch project reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/projects/${project.id}/reviews`],
    queryFn: () => getProjectReviews(project.id),
  });

  const reviews = reviewsData?.reviews || [];

  // Check if current user has already submitted a review
  const hasSubmittedReview = reviews.some(review => review.reviewerId === user?.id);

  // Determine if the project is completed
  const isCompleted = project.status === "completed";

  // Determine if current user is involved in the project
  const isInvolved = user?.id === project.userId || user?.id === project.providerId;

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async ({ projectId, rating, comment }: { projectId: number; rating: number; comment?: string }) => {
      setSubmittingReview(true);
      return await createReview(projectId, rating, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/reviews`] });
      setReviewDialogOpen(false);
      setReviewText("");
      setRating(5);
      toast({
        title: "Review submitted",
        description: "Your review has been submitted successfully.",
      });
      setSubmittingReview(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "There was an error submitting your review.",
        variant: "destructive",
      });
      setSubmittingReview(false);
    },
  });

  // Toggle review visibility mutation
  const toggleReviewVisibilityMutation = useMutation({
    mutationFn: toggleReviewVisibility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/reviews`] });
      toast({
        title: "Review visibility updated",
        description: "The review visibility has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update review visibility",
        description: error.message || "There was an error updating the review visibility.",
        variant: "destructive",
      });
    },
  });

  // Handle review submission
  const handleSubmitReview = () => {
    createReviewMutation.mutate({
      projectId: project.id,
      rating,
      comment: reviewText,
    });
  };

  // Handle toggling review visibility
  const handleToggleReviewVisibility = (reviewId: number) => {
    toggleReviewVisibilityMutation.mutate(reviewId);
  };

  // Render star rating input
  const StarRating = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${star <= value ? "text-yellow-400" : "text-gray-300"}`}
            onClick={() => onChange(star)}
          >
            <StarIcon className="h-6 w-6" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Details</CardTitle>
            <Badge className={PROJECT_STATUS[project.status].color}>
              {PROJECT_STATUS[project.status].label}
            </Badge>
          </div>
          <CardDescription>
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
            <p className="text-gray-700">{project.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Project Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm">
                    {project.dueDate 
                      ? `Due by ${new Date(project.dueDate).toLocaleDateString()}` 
                      : "No due date specified"}
                  </span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm">
                    Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {project.attachments && project.attachments.length > 0 && (
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="text-sm block mb-1">Attachments:</span>
                      <ul className="space-y-1">
                        {project.attachments.map((attachment, index) => (
                          <li key={index} className="text-sm text-primary-600 hover:underline">
                            <a href="#" className="flex items-center">
                              <span className="truncate">{attachment}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">People</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback>CU</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{project.userId === user?.id ? "You" : "Customer"}</p>
                    <p className="text-xs text-gray-500">Project Owner</p>
                  </div>
                </div>
                
                {project.providerId ? (
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarFallback>PR</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{project.providerId === user?.id ? "You" : "Service Provider"}</p>
                      <p className="text-xs text-gray-500">Assigned Professional</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <Avatar className="h-10 w-10 mr-4 bg-gray-200">
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">No service provider assigned yet</p>
                      <p className="text-xs">Waiting for assignment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews</CardTitle>
            {isInvolved && isCompleted && !hasSubmittedReview && (
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Leave a Review</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Leave a Review</DialogTitle>
                    <DialogDescription>
                      Share your experience with this project. Your feedback helps improve our service.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="review" className="text-sm font-medium">
                        Your Review (optional)
                      </label>
                      <Textarea
                        id="review"
                        placeholder="Write your review here..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitReview} disabled={submittingReview}>
                      {submittingReview ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReviews ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>
                          {review.reviewerId === user?.id ? "You" : "User"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">
                            {review.reviewerId === user?.id ? "You" : "User"}
                          </p>
                          <span className="text-gray-500 text-sm ml-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex mt-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? "text-yellow-400" : "text-gray-300"
                              }`}
                              fill={i < review.rating ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        {review.comment && <p className="text-gray-700">{review.comment}</p>}
                      </div>
                    </div>
                    {/* Toggle visibility button for review recipient */}
                    {review.receiverId === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleReviewVisibility(review.id)}
                        className="text-gray-500"
                      >
                        {review.hidden ? (
                          <EyeIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <EyeOffIcon className="h-4 w-4 mr-1" />
                        )}
                        {review.hidden ? "Show" : "Hide"}
                      </Button>
                    )}
                  </div>
                  {review.hidden && review.receiverId === user?.id && (
                    <div className="mt-2 text-sm text-gray-500 italic">
                      This review is hidden from public view.
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No reviews yet</p>
              {isInvolved && isCompleted && !hasSubmittedReview && (
                <p className="text-sm text-gray-400 mt-2">
                  Be the first to leave a review for this project.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
