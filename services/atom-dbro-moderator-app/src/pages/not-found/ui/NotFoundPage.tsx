import { Link } from 'react-router-dom'

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mt-4">Страница не найдена</h2>
        <p className="text-gray-500 mt-2 mb-8">
          Извините, запрашиваемая страница не существует.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  )
}

