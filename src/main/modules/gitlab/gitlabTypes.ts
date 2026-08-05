export interface GitLabUser {
  name: string;
  username: string;
  avatarUrl: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  projectId: number;
  title: string;
  description: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  author: GitLabUser;
  reviewers?: GitLabUser[];
  assignees?: GitLabUser[];
  labels?: string[];
  pipelineStatus?: "success" | "failed" | "running" | "canceled" | "skipped" | "none";
  hasConflicts: boolean;
  webUrl: string;
}

export interface GitLabCommit {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  createdAt: string;
}

export interface GitLabDiff {
  oldPath: string;
  newPath: string;
  diff: string;
  newFile: boolean;
  renamedFile: boolean;
  deletedFile: boolean;
}

export interface GitLabMrDetails {
  mr: GitLabMergeRequest;
  commits: GitLabCommit[];
  diffs: GitLabDiff[];
}
