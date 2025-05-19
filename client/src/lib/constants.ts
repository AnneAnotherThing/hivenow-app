export const PROJECT_TYPES = [
  { id: "website", label: "Website Development" },
  { id: "design", label: "Graphic Design" },
  { id: "content", label: "Content Creation" },
  { id: "marketing", label: "Digital Marketing" },
  { id: "other", label: "Other" }
];

export const PROJECT_STATUS = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800"
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800"
  }
};

export const SUBSCRIPTION_TIERS = [
  {
    id: "basic",
    name: "Basic",
    description: "For one-time simple projects",
    price: "$99",
    period: "per project",
    features: [
      "Single project completion",
      "3 days average delivery",
      "1 revision included",
      "Basic messaging support"
    ],
    popularChoice: false,
    color: "border-gray-200",
    buttonVariant: "outline"
  },
  {
    id: "pro",
    name: "Pro",
    description: "For regular project needs",
    price: "$199",
    period: "per month",
    features: [
      "4 projects per month",
      "2 days average delivery",
      "3 revisions included",
      "Priority messaging support",
      "Scheduled weekly meetings with your resource"
    ],
    popularChoice: true,
    color: "border-primary-500",
    buttonVariant: "default"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large-scale needs",
    price: "$799",
    period: "per month",
    features: [
      "Unlimited projects",
      "1 day average delivery",
      "Unlimited revisions",
      "Dedicated account manager"
    ],
    popularChoice: false,
    color: "border-gray-200",
    buttonVariant: "outline"
  }
];
