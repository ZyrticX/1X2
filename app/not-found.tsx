import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">404 - דף לא נמצא</h2>
        <p className="mb-6 text-gray-600">הדף שחיפשת לא נמצא. ייתכן שהכתובת שהזנת שגויה או שהדף הוסר.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
