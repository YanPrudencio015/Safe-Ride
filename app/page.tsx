import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";

import Form from "next/form";
import { Rubik } from "next/font/google";
import { Roboto } from "next/font/google";
import Passenger from "./dashboards/clientDashboard/Map";
import FormClient from "./components/FormClient";
import SafeRideForm from "./SafeRideApp";

const rubik = Rubik({
  subsets: ["latin"],
});
const roboto = Roboto({
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className="bg-[#FFF6F6] relative w-full h-screen flex justify-center items-center border-0 outline-0">
      {/* button to search for a driver */}
      <SafeRideForm />
    </div>
  );
}
