import FileComponent from "@/components/dashboard/FileComponent";
import Navbar from "@/components/dashboard/Navbar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

const page = () => {
  return (
    <div className=" bg-[#f9fafb] h-screen">
      <div className="border-b border-gray-200 ">
        <div className="max-w-7xl mx-auto">
          <Navbar />
        </div>
      </div>
      <div className="max-w-7xl mx-auto my-5 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="px-3 py-2 text-gray-400 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-center gap-1 shadow-sm">
                    <div>
                      <FolderOpenIcon className="text-gray-600 h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium text-black ">
                      My Workspace
                    </div>
                    <div>
                      <ChevronDownIcon className="text-gray-600 h-4 w-4" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                  <DropdownMenuItem>Team</DropdownMenuItem>
                  <DropdownMenuItem>Subscription</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="border border-gray-300 cursor-pointer p-2 rounded-full shadow-sm">
              <EllipsisVerticalIcon className="text-gray-600 h-4 w-4" />
            </div>
          </div>
          <div className="flex gap-3 items-center justify-between">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 gap-2 w-full max-w-xs">
              <SearchIcon className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your file..."
                className="flex-1 outline-none text-sm text-gray-700"
              />
            </div>
            <div>
              <Button className="px-3 py-2 shadow-sm flex gap-2 bg-[#364152]">
                <PlusIcon className="" />
                New File
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <FileComponent />
      </div>
    </div>
  );
};

export default page;
