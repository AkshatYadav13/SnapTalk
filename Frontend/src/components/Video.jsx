import React, { useEffect, useRef, useState } from 'react'

const Video = ({src}) => {

    const videoRef = useRef(null)
    const [isPlaying,setIsPlaying] = useState(false)

    useEffect(()=>{
        const currentVideo = videoRef.current;

        const observer = new IntersectionObserver(
            (entries)=>{
                entries.forEach((entry)=>{
                    if(entry.isIntersecting){
                        currentVideo.play()
                        setIsPlaying(true)
                    }
                    else{
                        currentVideo.pause()
                        setIsPlaying(false)
                    }
                })
            },
            {
                threshold:0.5
            }
        )

        if(videoRef.current){
            observer.observe(currentVideo)
        }

        return(()=>{
            observer.unobserve(currentVideo)
        })

    },[])

  return (
    <video 
        ref={videoRef}
        src={src} 
        className={`${ isPlaying ?'playing': 'paused'} h-[630px] object-fill`}
        controls
        autoPlay
        loop
    ></video>
  )
}

export default Video