"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
// import './styles.css';

import { Michroma, Roboto, Homenaje, Cal_Sans } from "next/font/google";

// import icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { faDollar } from '@fortawesome/free-solid-svg-icons';


// import type
import { CarsService } from '@/app/types/route';

interface SwiperCarServicesProps {
  setServiceCar: (car: CarsService) => void;
}

// interface CarsService {
//   service: string,
//   description: string,
//   price: string,
//   seats: number,
//   badge: string,
//   timer:number
// }


const roboto = Roboto({
  weight: "200",
  subsets: ["latin"],
});
const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
});
const homenaje = Homenaje({
  weight: "400",
  subsets: ["latin"],
});

const car1: CarsService = {service:"Standard", description:"Affordable, everyday rides",
  price:"$ 15.00",seats: 4,badge:"Best Price", timer: 3} 
const car2: CarsService = {service:"Comfort", description:"Newer cars with extra legroom",
  price:"$ 15.00",seats: 4,badge:"Extra Space", timer: 3} 
const car3: CarsService = {service:"Executive", description:"High-end luxury vehicles & top-rated drivers",
  price:"$ 15.00",seats: 4,badge:"VIP Experience", timer: 3} 
const car4: CarsService = {service:"SUV", description:"Spacious rides for up to 6 passengers",
  price:"$ 15.00",seats: 6,badge:"Extra Capacity", timer: 3} 
const car5: CarsService = {service:"Green", description:"Zero-emission & hybrid vehicles",
  price:"$ 15.00",seats: 4,badge:"Zero Emissions", timer: 3} 
const car6: CarsService = {service:"Access", description:"Wheelchair-accessible & extra assistance",
  price:"$ 15.00",seats: 4,badge:"Extra Care", timer: 3} 
const car7: CarsService = {service:"Pet", description:"Rides for you and your pets",
  price:"$ 15.00",seats: 4,badge:"Pet Friendly", timer: 3} 


  const carsServices = [car1,car2,car3,car4,car5,car6,car7]

export default function SwiperCarServices({setServiceCar}:SwiperCarServicesProps){

  // const [carService, setCarServise] = useState<CarsService>();


  // calc the responsiveness and then return the number of cards in Swipper
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window!== "undefined"? window.innerWidth:1200);

  function CardCountSlide(){
    if(windowWidth >= 640) return 4.5
    if(windowWidth >= 768 ) return 5
    if(windowWidth >= 1024 ) return 7
      return 2.5
  }

  useEffect(()=>{

    function ResizeWindow(){
      const width = window.innerWidth;
      setWindowWidth(width);
    } 

    ResizeWindow();
    window.addEventListener("resize",ResizeWindow);

    return () => {
    window.removeEventListener("resize", ResizeWindow);
  };

  },[])



  // change Card toggle 

  const[cardChosed, setCardChosed] = useState<number|null>(null);


    return(
        <div className="w-95 sm:w-full lg:w-[50%] h-[15em] md:h-[18em]  items-center z-10 
         rounded-[.5em]  overflow-hidden">
      <Swiper
        slidesPerView= {CardCountSlide()}
        spaceBetween={10}
        pagination={{
          clickable: true,
        }}
        className="mySwiper w-full h-full overflow-hiden "
      >

              {carsServices.map((car, index)=>(
              <SwiperSlide onClick={()=>{setServiceCar(car), setCardChosed(index)}} key={index} 
              className={` w-[1em] rounded-[.8em] flex flex-row items-center justify-around 
                text-white p-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[5.5px] 
                  border border-white/10 overflow-hidden relative before:absolute before:-z-10 
                  before:transition-all before:rounded-[20em] before:top-1/2 before:left-1/2 
                  before:-translate-x-1/2 before:-translate-y-1/2 before:duration-300 
                  before:ease-linear before:w-[1em] before:h-[1em] transition-all duration-300
                 ${cardChosed == index?
                  "before:bg-[#2373F4] scale-90 before:w-[30em] before:h-[30em] -translate-y-1 transition-all duration-700" :
                 ' bg-white/2  transition-all duration-300'}`}>
                <div className='w-full h-full flex flex-col justify-center gap-5'>
                  <h1 className={`text-[2.5vh] h-10 ${michroma.className} flex items-center 
                  justify-center`}>{car.service}</h1>
                  <p className={`w-full flex justify-center text-center items-center ${roboto.className}
                  text-[2vh] md:text-[1.5vh] h-[5em] relative before:w-[50%] before:h-[1px]
                  before:bg-white before:absolute before:left-[50%] before:translate-x-[-50%] 
                  before:top-0 after:w-[50%] after:h-[1px]
                  after:bg-white after:absolute after:left-[50%] after:translate-x-[-50%] 
                  after:bottom-0
                  `}>{car.description}</p>
                  <p className={`w-full  text-center ${homenaje.className}
                  text-[1.8vh] h-[2em] px-2 flex justify-end 
                  `}>{car.timer} min</p>
                  <div className='w-full h-[2em] flex justify-between items-center px-0'>
                  <div className=' flex flex-row justify-center items-center
                  w-[2.5em] h-full text-[.8em]'>
                  <FontAwesomeIcon icon={faUser} className="size-1 text-[1.8vh]" />{car.seats}</div>
                  <div className='px-2 h-full flex justify-center gap-1 items-center flex-row'>
                  <div className={`border-0 flex justify-center items-center rounded-[5em] text-center 
                  w-[1em] h-[1em]  shadow-[0_4px_30px_rgba(0,0,0,0.1)] 
                  backdrop-blur-[6.4px] ${cardChosed == index?"bg-[#CC6F00]":"bg-white/15"}`}>
                  <FontAwesomeIcon icon={faDollar} className="size-1 text-[1.8vh] " />
                  </div>
                  <h3 className="text-[1.8vh]">{car.price}</h3>
                  </div>
                  </div>
                  <h3 className={`rounded-[.5em] w-[90%] h-[2em] flex justify-center 
                  items-center  shadow-[0_4px_30px_rgba(0,0,0,0.1)] 
                  backdrop-blur-[6.4px] text-white self-center ml-[5%] text-[2vh] mb-2
                  ${roboto.className}
                  ${cardChosed == index? "bg-transparent": " bg-[#2373F4]"}
                  `}>{car.badge}</h3>
                </div>
              </SwiperSlide>
              ))}

          </Swiper>
</div>
    )
}