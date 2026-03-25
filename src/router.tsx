import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CreateFamilyPage } from '@/pages/CreateFamilyPage'
import { HomePage } from '@/pages/HomePage'
import { TimelinePage } from '@/pages/TimelinePage'
import { AlbumsPage } from '@/pages/AlbumsPage'
import { RecapsPage } from '@/pages/RecapsPage'
import { SearchPage } from '@/pages/SearchPage'
import { AddMemoryPage } from '@/pages/AddMemoryPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/family/create', element: <CreateFamilyPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'timeline', element: <TimelinePage /> },
          { path: 'albums', element: <AlbumsPage /> },
          { path: 'recaps', element: <RecapsPage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'memories/add', element: <AddMemoryPage /> },
        ],
      },
    ],
  },
])
