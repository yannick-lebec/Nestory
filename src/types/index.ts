export type FamilyRole = 'parent' | 'child' | 'guest'

export type MemoryCategory =
  | 'anniversary'
  | 'vacation'
  | 'school'
  | 'everyday'
  | 'trip'
  | 'quote'
  | 'achievement'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface Family {
  id: string
  name: string
  createdAt: string
}

export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  role: FamilyRole
  displayName: string
  avatarUrl?: string
}

export interface MemoryMedia {
  id: string
  memoryId: string
  mediaType: 'photo' | 'video'
  storageKey: string
  url: string
  createdAt: string
}

export interface Memory {
  id: string
  familyId: string
  authorId: string
  title: string
  description?: string
  memoryDate: string
  locationName?: string
  mood?: string
  category: MemoryCategory
  tags: string[]
  people: string[]
  mediaCount: number
  coverUrl?: string
  media?: MemoryMedia[]
  createdAt: string
}

export interface Album {
  id: string
  familyId: string
  title: string
  description?: string
  coverUrl?: string
  memoryCount: number
  createdAt: string
}

export interface Recap {
  id: string
  familyId: string
  month: number
  year: number
  title: string
  summary: string
  coverImageUrl?: string
  highlightCount: number
}
