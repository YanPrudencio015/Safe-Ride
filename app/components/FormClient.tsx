import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";

import Form from "next/form";
import { Rubik } from "next/font/google";
import { Roboto } from "next/font/google";
import { useState } from "react";

// to generate suggestions when the user types an address.

// 1.
import { SearchBox } from "@mapbox/search-js-react";
const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

const rubik = Rubik({
  subsets: ["latin"],
});
const roboto = Roboto({
  subsets: ["latin"],
});

type FormProps = {
  onSubmit: (origin: string, destination: string) => void;
};

export default function FormClient({ onSubmit }: FormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div
      className=" bg-[#285A48] w-full lg:w-[28em] h-[18em] lg:h-full z-10 flex justify-start 
      items-center flex-col gap-5"
    >
      <div className="w-full flex justify-between flex-row border border-white h-[3em] items-center px-5">
        <h1 className={`${roboto} text-[1.2em]`}>Safe Ride</h1>
        <button type="button">
          <FontAwesomeIcon icon={faBars} className="size-6" />
        </button>
      </div>
      <Form
        action={"/"}
        className="w-full h-[8em]  flex justify-center items-center flex-col px-3 gap-3
          text-[#EEEE] relative before:absolute before:h-px before:w-[80%] before:bg-[#EEEE]"
      >
        <div
          className=" w-full h-[3em]  rounded-2xl  flex justify-between flex-row
          items-center px-4 gap-2"
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} className="size-6" />
          <SearchBox
            accessToken={`${token}`}
            value={origin}
            onChange={(value) => setOrigin(value)}
            onRetrieve={(res) => {
              const coords = res.features[0].geometry.coordinates;
              setOrigin(res.features[0].properties.full_address);
            }}
            options={{
              language: "pt",
              country: "BR",
            }}
          />
        </div>
        <div
          className=" w-full h-[3em] rounded-2xl  flex justify-between flex-row
          items-center px-4 gap-2"
        >
          <FontAwesomeIcon icon={faLocationDot} className="size-6 " />
          <SearchBox
            accessToken={`${token}`}
            value={destination}
            onChange={(value) => setDestination(value)}
            onRetrieve={(res) => {
              const coords = res.features[0].geometry.coordinates;
              setDestination(res.features[0].properties.full_address);
            }}
            options={{
              language: "pt",
              country: "BR",
            }}
          />
        </div>
      </Form>
      <button
        className={` w-[90%] h-[3em] rounded-[5em] z-10
      bg-[#075B5E] active:scale-95 transition-all duration-200
      ease-in-out text-white ${rubik.className}`}
        onClick={() => onSubmit(origin, destination)}
      >
        SEARCH A DRIVER
      </button>
    </div>
  );
}
