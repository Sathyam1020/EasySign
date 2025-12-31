'use client'

import { BellIcon, GiftIcon, UserIcon } from "lucide-react";
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

const Navbar = () => {
  const [pro, setPro] = useState(false); 
  const name = "Sathyam";

  const buyPro = () => {
    setPro(true);
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between py-5">
        <div className="text-3xl font-bold ">E</div>
        <div className="flex items-center gap-4">
          {!pro && (
            <div className="flex items-center justify-center gap-2">
              <div className="font-semibold text-sm ">2-day free trial 👉🏼 </div>
              <Button onClick={buyPro} className="bg-[#ff7f4a] text-sm rounded-xl text-black px-2 py-1 text-md font-medium border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000]">
                Buy Pro
              </Button>
            </div>
          )}
          <div className="border rounded-full p-2 border-orange-400 bg-orange-50 cursor-pointer">
            <GiftIcon className="h-4 w-4 text-orange-400"/>
          </div>
          <div className="border rounded-full p-2 border-gray-400 cursor-pointer">
            <BellIcon className="h-4 w-4 text-gray-400"/>
          </div>
          <div>Hi, {name}</div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="p-2 text-gray-400 border border-gray-400 rounded-full cursor-pointer flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-400"/>
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
