export default function Loading() {
  return (
    <div className="h-screen flex flex-col justify-center items-center text-2xl font-bold">
      <div
        className={`w-10 h-10 border-t-4  border-t-gray-300 rounded-full mb-5 animate-spin`}
      ></div>
      <div>Loading...</div>
    </div>
  );
}
