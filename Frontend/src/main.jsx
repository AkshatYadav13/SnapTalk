import './index.css'
import { createRoot } from 'react-dom/client'
import {Toaster} from './components/ui/sonner.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './redux/store'
import { PersistGate } from 'redux-persist/integration/react'
import persistStore from 'redux-persist/es/persistStore'

import App from './App.jsx'
import Home from './components/Home'
import Signup from './components/auth/Signup'
import Login from './components/auth/Login'
import Profile from './components/Profile'
import EditProfile from './components/EditProfile'
import Chatpage from './components/Chatpage'
import ProtectedRoutes from './components/ProtectedRoutes'
import SetProfile from './components/auth/setProfile'
import Notifications from './components/Notifications'
import CreateGroup from './components/CreateGroup'
import EditGroup from './components/EditGroup'

const router = createBrowserRouter([
  {
    path:'/',
    element:<ProtectedRoutes><App></App></ProtectedRoutes>,
    children:[
      {
        path:'/',
        element:<ProtectedRoutes><Home></Home></ProtectedRoutes>
      },
      {
        path:'/profile/:id',
        element:<ProtectedRoutes><Profile></Profile></ProtectedRoutes>
      },
      {
        path:'/userProfile/:id',
        element:<ProtectedRoutes><Profile></Profile></ProtectedRoutes>
      },
      {
        path:'/edit',
        element:<ProtectedRoutes><EditProfile></EditProfile></ProtectedRoutes>
      },
      {
        path:'/chat',
        element:<ProtectedRoutes><Chatpage></Chatpage></ProtectedRoutes>,
      },
      {
        path:'/notifications',
        element:<ProtectedRoutes><Notifications></Notifications></ProtectedRoutes>
      },
      {
        path:'group/create',
        element:<CreateGroup></CreateGroup>
      },
      {
        path:'group/edit/:id',
        element:<EditGroup></EditGroup>
      } 
    ]
  },
  {
    path:'/signup',
    element:<Signup></Signup>,
  },
  {
    path:'login',
    element:<Login></Login>
  },
  {
    path:'setProfile/:id',
    element:<SetProfile></SetProfile>
  },
  {
    future: {
      v7_fetcherPersist: true,
    },
  }
]

)


const persistor = persistStore(store)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router}></RouterProvider>
        <Toaster></Toaster>
      </PersistGate>
  </Provider>
)
