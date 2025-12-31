import { fileList } from "@/constants/data";
import { FileCard } from "./FileCard";


export default function FileComponent() {
    console.log(fileList);
  return (
    <div className="flex gap-5 flex-wrap">
      {fileList.map((file, i) => (
        <FileCard
          key={i}
          name={file.name}
          theme={file.theme}
          signed={file.signed}
        />
      ))}
    </div>
  )
}