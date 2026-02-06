"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/utils/helpers";

interface AvatarProps {
  name: string;
  image: string | null | undefined;
  size?: "sm" | "md" | "lg";
}

export default function UserAvatar({ name, image, size = "md" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  
  const firstLetter = name?.trim().charAt(0).toUpperCase() || "?";
  
  const finalSrc = image ? getImageUrl('profiles', image) : null;
  
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-16 h-16 text-lg",
  };

  return (
    <div className={`relative ${sizeClasses[size]} shrink-0 select-none`}>
      {finalSrc && !imgError ? (
        <Image 
          src={finalSrc} 
          alt={name} 
          fill 
          className="rounded-full border-2 border-white shadow-sm object-cover" 
          unoptimized 
          onError={() => setImgError(true)} 
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center rounded-full text-white font-black shadow-inner"
          style={{
            background: "linear-gradient(135deg, #4A86C5 0%, #36679a 100%)"
          }}
        >
          {firstLetter}
        </div>
      )}
    </div>
  );
}