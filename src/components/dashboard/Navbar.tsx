"use client";

import { BellIcon, BuildingIcon, ChevronDownIcon, GiftIcon, UserIcon } from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import Image from "next/image";
import logo from "../../../public/logos/easysign.png";

const Navbar = () => {
  const [pro, setPro] = useState(false);
  const name = "Sathyam";

  const buyPro = () => {
    setPro(true);
  };

  return (
    <div className="max-w-7xl mx-auto ">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="logo" width={90} height={90} />
          <div className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200  rounded-xl cursor-pointer flex items-center gap-1 shadow-sm">
            <BuildingIcon className="text-gray-600 h-4 w-4" />
            <div className="text-sm font-medium text-gray-600">
              Workspace
            </div>
            <ChevronDownIcon className="text-gray-600 h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center gap-7">
          {!pro && (
            <div className="flex items-center justify-center gap-2">
              <div className="font-semibold text-sm ">2-day free trial 👉🏼 </div>
              <Button
                onClick={buyPro}
                className="bg-[#ff7f4a] rounded-xl text-black px-2.5 py-1.5 text-sm font-normal border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000]"
              >
                Buy PRO
              </Button>
            </div>
          )}
          <div className="border rounded-full p-2 border-orange-400 bg-orange-50 cursor-pointer">
            <GiftIcon className="h-4 w-4 text-orange-400" />
          </div>
          <div className="border rounded-full p-2 border-gray-400 cursor-pointer">
            <BellIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div>Hi, {name}</div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="p-2 text-gray-400 border border-gray-400 rounded-full cursor-pointer flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
