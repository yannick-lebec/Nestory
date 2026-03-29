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

export interface RecapMemory {
  id: string
  title: string
  description?: string
  aiDescription?: string
  memoryDate: string
  locationName?: string
  people: string[]
  coverUrl?: string
  photoUrls?: string[]
}

export interface RecapCategory {
  key: string
  label: string
  emoji: string
  count: number
  memories: RecapMemory[]
}

export interface Recap {
  month: number
  year: number
  monthLabel: string
  totalMemories: number
  totalPhotos: number
  categories: RecapCategory[]
  aiAvailable: boolean
}
