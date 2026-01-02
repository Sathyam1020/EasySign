'use client'
import { navItems } from "@/constants/constants";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const Navbar = () => {

  const router = useRouter(); 

  return (
    <div className="flex items-center justify-between gap-10 px-10 py-5">
      <div className="text-3xl font-bold ">SignEasy</div>
      <div className="flex items-center gap-4">
        {navItems.map((item) => (
          <div className="text-black hover:underline font-semibold cursor-pointer" key={item.name}>{item.name}</div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/login')} className="bg-[#ffe711] text-black text-md font-semibold border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000]">
          Login 
        </Button>
        <Button className="bg-[#46ad94] text-black text-md font-semibold border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000]">
          Sign Up
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
