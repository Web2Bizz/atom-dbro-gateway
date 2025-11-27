import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Базовый URL админского API (без /admin/api-json)
// Документация: https://it-hackathon-team05.mephi.ru/admin/api-json
const ADMIN_BASE_URL = __ENV.ADMIN_BASE_URL || 'https://it-hackathon-team05.mephi.ru/admin';

// Токен администратора для Authorization: Bearer <token>
// Обязателен для большинства защищённых админских эндпоинтов.
const ADMIN_TOKEN = __ENV.ADMIN_TOKEN || '';

if (!ADMIN_TOKEN) {
  // k6 не поддерживает console.warn в setup, но при запуске без токена
  // этот тест всё равно сможет нагрузить только публично доступные админские ручки (если такие есть).
}

// Настраиваемые пороги через переменные окружения
const FAILED_RATE_THRESHOLD = parseFloat(__ENV.FAILED_RATE_THRESHOLD || '0.02'); // По умолчанию <2% ошибок
const DURATION_P95_THRESHOLD = parseFloat(__ENV.DURATION_P95_THRESHOLD || '1000'); // По умолчанию p95 < 1000ms
const DISABLE_THRESHOLDS = __ENV.DISABLE_THRESHOLDS === 'true'; // Отключить пороги для отладки

export const options = {
  scenarios: {
    ramping_admin: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 15 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: DISABLE_THRESHOLDS
    ? {} // Отключены пороги
    : {
        http_req_failed: [`rate<${FAILED_RATE_THRESHOLD}`],
        http_req_duration: [`p(95)<${DURATION_P95_THRESHOLD}`],
      },
};

export default function () {
  const headers = ADMIN_TOKEN
    ? {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };

  // Пример набора типичных административных операций,
  // основанных на сущностях из openapi‑документации:
  // регионы, города, организации, квесты, категории и т.п.

  group('admin_list_entities', () => {
    // Список регионов
    let res = http.get(`${ADMIN_BASE_URL}/api/v1/regions`, { headers });
    check(res, {
      'admin regions 200/401/403': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403,
    });

    // Список пользователей
    res = http.get(`${ADMIN_BASE_URL}/api/v1/users`, { headers });
    check(res, {
      'admin users 200/401/403': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403,
    });

    // Список организаций
    res = http.get(`${ADMIN_BASE_URL}/api/v1/organizations`, { headers });
    check(res, {
      'admin organizations 200/401/403': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403,
    });

    // Список квестов (если предусмотрен админский эндпоинт для управления квестами)
    res = http.get(`${ADMIN_BASE_URL}/api/v1/quests`, { headers });
    check(res, {
      'admin quests 200/401/403/404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
    });

    sleep(0.3);
  });

  group('admin_single_entity', () => {
    // Пример запросов к одиночным ресурсам (по ID = 1 как стабильный сценарий).
    // При необходимости можно заменить на реальные ID из тестовой БД.

    let res = http.get(`${ADMIN_BASE_URL}/api/v1/regions/1`, { headers });
    check(res, {
      'admin region by id 200/401/403/404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
    });

    res = http.get(`${ADMIN_BASE_URL}/api/v1/users/1`, { headers });
    check(res, {
      'admin user by id 200/401/403/404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
    });

    res = http.get(`${ADMIN_BASE_URL}/api/v1/organizations/1`, { headers });
    check(res, {
      'admin org by id 200/401/403/404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 403 || r.status === 404,
    });

    sleep(0.3);
  });

  // При необходимости сюда можно добавить write‑операции (создание/обновление),
  // но обычно для нагрузочного теста сначала проверяют, что тестовые данные
  // и изолированное окружение готовы, чтобы не портить боевую БД.

  sleep(0.4);
}


