import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import React from "react";
import { Link } from "react-router-dom";
import { MdOutlineArrowForwardIos } from "react-icons/md";


const Rightsidebar = () => {
  const { user,suggestedUsers } = useSelector((store) => store.auth);

  return (
    <div className="w-full h-full flex flex-col border-t border-gray-300 sm:border-none sm:gap-16 sm:py-7 sm:pr-2 lg:p-10  gap-5 dark:border-[#312e2e] dark:text-white">

      <Link to={`/profile/${user?._id}`}>
        <div className="flex gap-4 pr-2 pl-4  hover:bg-gray-200 py-5 dark:hover:bg-[#212121]">
          <Avatar className="w-10 h-10 bg-gray-300">
            <AvatarImage src={user?.profilePic} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="leading-none">{user?.username}</h1>
                <span className="text-sm font-thin text-gray-500" > {  user?.bio.split('\\')[0].slice(0,40) + ' .....' }</span>
          </div>
        </div>
      </Link>

      <div>
        <div className="flex gap-3 items-center  mb-8 pr-2 pl-4"> 
          <h1>Suggested users... </h1>
        </div>

        <div className="flex flex-col">
            {
              suggestedUsers?.map((u)=>(
                <Link key={u._id} to={`/userProfile/${u?._id}`}>
                    <div className={`px-4 flex group hover:bg-gray-200  my-[3px] p-2 justify-between items-center sm:gap-8 lg:gap-20 sm:pr-2 dark:hover:bg-[#212121]`}>
                          <div className="flex gap-3 items-center">
                            <Avatar className="w-10 h-10 bg-gray-300">
                              <AvatarImage src={u?.profilePic} />
                              <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div>
                              <h1 className="leading-none text-nowrap ">{u?.username}</h1>
                              <span className="font-thin text-sm text-nowrap">{u?.followers.length} followers</span>
                            </div>
                          </div>

                        <span className="text-blue-500 invisible group-hover:visible chatmb:mr-4">
                          <MdOutlineArrowForwardIos></MdOutlineArrowForwardIos>
                        </span>
                    </div>
                </Link>    
              ))
            }
        </div>

      </div>
    </div>
  );
};

export default Rightsidebar;
