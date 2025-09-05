import { useDispatch} from "react-redux"
import { useEffect } from "react"
import { setPosts } from "@/redux/postSlice"

const useGetAllPosts = ()=>{
    const dispatch = useDispatch()

    async function fetchAllPosts(){
        try {
            const res = await fetch(`http://localhost:8000/api/v1/post/all`,{
                method:'GET',
                credentials:'include'
            })
            const data = await res.json()
            if(data.success){
                dispatch(setPosts(data.posts))
                return
            }
            
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(()=>{
        fetchAllPosts()
    },[])
}

export default useGetAllPosts

