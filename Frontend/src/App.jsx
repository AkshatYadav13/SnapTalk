import { Outlet } from 'react-router-dom'
import Leftsidebar from './components/Leftsidebar'
import { useGetNotifications } from './hooks/useGetNotifications'
import { SocketProvider } from './lib/SocketContext'
import { useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux'

function App() {
  const { user } = useSelector(store => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useGetNotifications(); // if it's a hook

  return (
    <SocketProvider>
      <div className="flex">
        <Leftsidebar />
        <Outlet />
      </div>
    </SocketProvider>
  );
}


export default App