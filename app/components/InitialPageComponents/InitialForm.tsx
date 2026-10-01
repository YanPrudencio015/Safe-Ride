'use client'
import { Michroma, Chathura, Homenaje } from "next/font/google";


// import Mapbox
// import { SearchBox } from "@mapbox/search-js-react";
import { SearchBox } from "@mapbox/search-js-react";
import { useEffect, useState } from "react";
import 'mapbox-gl/dist/mapbox-gl.css';

const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
});
const didactGothic = Chathura({
  weight: "400",
  subsets: ["latin"],
});
const homenaje = Homenaje({
  weight: "400",
  subsets: ["latin"],
});


const Theme = {
  variables: {
    unit: "20px",
    colorBackground: "#F5F5F5",
    colorBackgroundHover: "#F5F5F5",
    border: "0",
    colorText: "#091413",
    boxShadow: "none",
  },
  cssText: `
    .Input,
    .Input:focus,
    .Input:focus-within,
    input:focus,
    input:focus-visible {
      outline: none !important;
      box-shadow: none !important;
      border: none !important;
    }

    .Input{
        font-size: 20px ;
        width: 90%;
        height: 40px;
        background-color: #F5F5F5;
        text-align: center;
        color: #091413
        border-radius: 60px;
        z-index: 30;
    }
  `,
};

interface InitialFormProps {
  setCoordinates: (coords: [number, number][]) => void;
}

export default function InitialForm({setCoordinates}:InitialFormProps){

    const[ firsCoordinates, setFirstCoordinates] = useState<[number, number] | null>(null);
    const[ secondCoordinates, setSecondCoordinates] = useState<[number, number] | null >(null);
    const [fristLocation, setFristLocation] = useState("");
    const [secondLocation, setSecondLocation] = useState("");
    const [backgroundTougle, setBackgroundTougle] = useState(false);

  useEffect(()=>{
    if (firsCoordinates && secondCoordinates) {
   setCoordinates([firsCoordinates, secondCoordinates]);
    }
  },[firsCoordinates, secondCoordinates ])


    return(
        <div className={`z-50 flex 
        justify-center items-center ${backgroundTougle? 
          "bg-[rgba(0,0,0,.8)] w-full h-screen fixed overflow-auto": 
          "bg-transparent relative w-full"}
        `} onClick={()=>setBackgroundTougle(false)}>

            <div className="w-98 md:w-[80%] h-[6em] md:h-[8em] bg-white/15 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] 
              backdrop-blur-[6.4px] flex justify-around items-center p-0 flex-col z-40 px-1">

            <div className="w-full md:w-100 h-[2em] md:h-[2.5em] bg-[#F5F5F5] rounded-[.5em] flex justify-center items-center"
            >
                <SearchBox
                      onRetrieve={(res) => {
                          const coords = res.features[0].geometry.coordinates as [number, number];
                          setFirstCoordinates(coords);
                      }} 
                      theme={Theme} accessToken={`${token}`}  placeholder="Add location"
                      options={{
                      language: "pt",
                      country: "BR",
                    }}
                      value={fristLocation}
                      onChange={(value) => {setFristLocation(value); setBackgroundTougle(true)}}
                      /> 

            </div>
            <div className="w-full md:w-100 h-[2em] md:h-[2.5em] bg-[#F5F5F5] rounded-[.5em] flex justify-center items-center"
            >
                <SearchBox
                      onRetrieve={(res) => {
                          const coords = res.features[0].geometry.coordinates as [number, number];
                          setSecondCoordinates(coords);
                      }} 
                      theme={Theme} accessToken={`${token}`}  placeholder="Add location"
                      options={{
                      language: "pt",
                      country: "BR",
                    }}
                      value={secondLocation}
                      onChange={(value) => {setSecondLocation(value); setBackgroundTougle(true)}}
                      
                      />       
            </div>
          </div>
        </div>

    )
}


