
import React, { useEffect, useState } from "react"
import { faHouse,faComment, faUser } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import { Michroma, Chathura, Homenaje } from "next/font/google";

const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
});
const chathura = Chathura({
  weight: "400",
  subsets: ["latin"],
});
const homenaje = Homenaje({
  weight: "400",
  subsets: ["latin"],
});


export default function NavigatioBar(){

    //  button effect when active
const buttons = [
    {icon:faHouse, title:"Main"},
    {icon:faComment, title:"analysis"},
    {icon:faUser, title:"Profile"},
]
const [toggleBtn, setToggleBtn] = useState(0);

useEffect(()=>{

    if(toggleBtn === 0){
        // console.log("O numero do butão clicado é: ", 0)
    } else{
        // console.log("O numero do butão clicado é: ", toggleBtn)

    }

},[toggleBtn])



    return(
        <div className={`w-90 h-[9vh] border-0 bg-[#092328] z-50 fixed bottom-2 rounded-[3em]
            flex flex-row gap-4 items-center px-5 justify-center p-1 ${chathura.className} 
            `}>

                {buttons.map((btn,index)=>(
                <button key={index} onClick={()=>setToggleBtn(index)}
                className={` h-full  flex justify-center items-center overflow-hidden
                    relative before:absolute before:bg-[#00B7CD] rounded-[50em] 
                    before:z-[-1]  before:rounded-[50em] border-0
                    ${toggleBtn === index? 
                        "w-[35vw] flex-row gap-1.5 before:w-[500em] before:h-[5em] text-[#fff] scale-100 before:transition-all before:duration-700": 
                        "w-[13vw] before:w-0 before:h-0 text-[#00B7CD] scale-80"
                 }`}>
                    <FontAwesomeIcon icon={btn.icon} className="size-2  text-[1.5em]" />
                    <p className={` text-[2em] ${toggleBtn === index? "inline":"hidden"}`}>{btn.title}</p>
                </button>
                ))}
        </div>
    )
}