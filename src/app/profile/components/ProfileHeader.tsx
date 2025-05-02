import Image from "next/image";

export default function ProfileHeader() {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
        <Image
          src="/icon.png"
          alt="Profile picture"
          fill
          className="object-cover"
        />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">John Doe</h1>
      <p className="text-gray-600">Member since 2023</p>
    </div>
  );
}
