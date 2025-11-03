/** Repository information from GitHub API */
export interface IRepo {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
  }
  private: boolean
}

/** Release information from GitHub API */
export interface IRelease {
  id: number
  tag_name: string
  name: string
  published_at: string
  assets: IAsset[]
}

/** Asset information from GitHub release */
export interface IAsset {
  id: number
  name: string
  size: number
  content_type: string
}

/** GitHub API rate limit information */
export interface IRateLimit {
  limit: number
  used: number
  remaining: number
  reset: number
}
