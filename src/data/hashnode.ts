export interface HashnodePost {
  title: string;
  slug: string;
  url: string;
  brief: string;
  date: string;
  tags: string[];
}

export const hashnodePosts: HashnodePost[] = [
  {
    title: "The Zen of Stacked PRs: How to Stop Shipping \"Walls of Code\"",
    slug: "stacked-pull-requests-github-guide",
    url: "https://amjedidiah.hashnode.dev/stacked-pull-requests-github-guide",
    brief: "Break large pull requests into smaller, manageable stacked PRs to improve code review quality.",
    date: "2026-09-26",
    tags: ["git", "workflow"],
  },
  {
    title: "Systematising Intuition: How to Code \"Seniority\" into an AI",
    slug: "systematizing-intuition-coding-seniority",
    url: "https://amjedidiah.hashnode.dev/systematizing-intuition-coding-seniority",
    brief: "How to give AI models system instructions that replicate senior developer judgment patterns.",
    date: "2026-01-03",
    tags: ["ai", "engineering"],
  },
  {
    title: "How to Master AI Coding: The \"Junior Developer\" Mental Model",
    slug: "ai-coding-teacher-mindset",
    url: "https://amjedidiah.hashnode.dev/ai-coding-teacher-mindset",
    brief: "Why engineers have varying experiences with AI coding tools, and a mentoring framework to improve effectiveness.",
    date: "2025-12-06",
    tags: ["ai", "productivity"],
  },
  {
    title: "The Complete Guide to SSH: Advanced Topics",
    slug: "advanced-ssh-guide",
    url: "https://amjedidiah.hashnode.dev/advanced-ssh-guide",
    brief: "In-depth exploration of advanced SSH features: tunneling, config, keys, and agent forwarding.",
    date: "2025-11-06",
    tags: ["devops", "ssh"],
  },
  {
    title: "A Beginner's Guide to SSH",
    slug: "beginners-guide-to-ssh",
    url: "https://amjedidiah.hashnode.dev/beginners-guide-to-ssh",
    brief: "SSH fundamentals for remote server access, code deployment, and cloud instance management.",
    date: "2025-11-04",
    tags: ["devops", "ssh"],
  },
];
