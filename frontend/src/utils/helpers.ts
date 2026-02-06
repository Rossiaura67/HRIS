export const getImageUrl = (type: 'profiles' | 'logos', src: string | null) => {
  if (!src || src === "null" || src === "") return null;
  if (src.startsWith("http")) return src;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return `${API_URL}/public/${type}/${src}`;
};