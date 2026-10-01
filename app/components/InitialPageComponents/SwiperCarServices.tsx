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





    return(
        <div className="w-95 h-[8.5em] items-center z-10">
      <Swiper
        slidesPerView= {2.5}
        spaceBetween={10}
        pagination={{
          clickable: true,
        }}
        className="mySwiper w-full h-full overflow-visible!"
      >

              {carsServices.map((car, index)=>(
              <SwiperSlide onClick={()=>{setServiceCar(car)}} key={index} 
              className=' w-[1em] 
                rounded-[.8em] flex flex-row items-center 
                justify-center text-white p-0
                bg-white/[0.02]  shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[5.5px] border border-white/10'>
                <h1 className={`text-[.6em] h-10 ${michroma.className} flex items-center 
                justify-center px-2`}>{car.service}</h1>
                <p className={`w-full  text-center ${roboto.className}
                text-[.5em] h-[3em]
                `}>{car.description}</p>
                <p className={`w-full  text-end ${homenaje.className}
                text-[.6em] h-[2em] border-b-[.6px] border-[#B0E4CC] px-2
                `}>{car.timer} min</p>
                <div className='w-full h-[2em] flex justify-between items-center px-0'>
                <div className=' flex flex-row justify-center items-center
                w-[2.5em] h-full text-[.8em]'>
                <FontAwesomeIcon icon={faUser} className="size-1 text-[.8em]" />{car.seats}</div>
                <div className='px-2 h-full flex justify-center gap-1 items-center flex-row'>
                <div className=' border-0 flex justify-center items-center rounded-[5em] text-center 
                w-[1em] h-[1em]  bg-white/15  shadow-[0_4px_30px_rgba(0,0,0,0.1)] 
                backdrop-blur-[6.4px]'>
                <FontAwesomeIcon icon={faDollar} className="size-1 text-[.5em] " />
                </div>
                <h3 className=" text-[.5em]">{car.price}</h3>
                </div>
                </div>
                <h3 className={`rounded-[1em] w-[90%] h-[1.5em] flex justify-center items-center text-[.5em]
                bg-white/15  shadow-[0_4px_30px_rgba(0,0,0,0.1)] 
                backdrop-blur-[6.4px]
                text-white self-center ml-[5%]
                ${roboto.className}`}>{car.badge}</h3>
              </SwiperSlide>
              ))}

          </Swiper>
</div>
    )
}