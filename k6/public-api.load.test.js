import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// Базовый URL публичного API (без /api-json)
// Документация: https://it-hackathon-team05.mephi.ru/api-json
const BASE_URL = __ENV.BASE_URL || 'https://it-hackathon-team05.mephi.ru';

// Кастомные метрики
const regionsDuration = new Trend('regions_duration');
const citiesDuration = new Trend('cities_duration');
const usersDuration = new Trend('users_duration');
const organizationsDuration = new Trend('organizations_duration');
const questsDuration = new Trend('quests_duration');

// Настраиваемые пороги через переменные окружения
const FAILED_RATE_THRESHOLD = parseFloat(__ENV.FAILED_RATE_THRESHOLD || '0.01'); // По умолчанию <1% ошибок
const DURATION_P95_THRESHOLD = parseFloat(__ENV.DURATION_P95_THRESHOLD || '800'); // По умолчанию p95 < 800ms
const DISABLE_THRESHOLDS = __ENV.DISABLE_THRESHOLDS === 'true'; // Отключить пороги для отладки

export const options = {
  // Пример умеренной нагрузки, пригодной для начала
  scenarios: {
    ramping_read_only: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },  // разогрев
        { duration: '3m', target: 30 },  // основная нагрузка
        { duration: '1m', target: 0 },   // спад
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: DISABLE_THRESHOLDS
    ? {} // Отключены пороги
    : {
        http_req_failed: [`rate<${FAILED_RATE_THRESHOLD}`],
        http_req_duration: [`p(95)<${DURATION_P95_THRESHOLD}`],
        regions_duration: ['p(95)<500'],
        cities_duration: ['p(95)<500'],
        users_duration: ['p(95)<700'],
        organizations_duration: ['p(95)<700'],
        quests_duration: ['p(95)<800'],
      },
};

export default function () {
  // Метрики Prometheus
  group('metrics', () => {
    const res = http.get(`${BASE_URL}/api/v1/metrics`);
    check(res, {
      'metrics status is 200': (r) => r.status === 200,
    });
    sleep(0.2);
  });

  // Регионы и города (см. документацию API: /api/v1/regions, /api/v1/regions/{id}/cities, /api/v1/cities)
  group('regions_and_cities', () => {
    let res = http.get(`${BASE_URL}/api/v1/regions`);
    regionsDuration.add(res.timings.duration);

    check(res, {
      'regions status is 200': (r) => r.status === 200,
    });

    const regions = safeJson(res, []);
    if (Array.isArray(regions) && regions.length > 0) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const regionId = region.id || region.regionId || 1;

      // Города региона
      res = http.get(`${BASE_URL}/api/v1/regions/${regionId}/cities`);
      citiesDuration.add(res.timings.duration);
      check(res, {
        'region cities status is 200 or 404': (r) =>
          r.status === 200 || r.status === 404,
      });
    }

    // Все города, возможно с фильтром по региону (regionId)
    const qsRegionId = regions.length > 0 ? `?regionId=${regions[0].id || 1}` : '';
    res = http.get(`${BASE_URL}/api/v1/cities${qsRegionId}`);
    citiesDuration.add(res.timings.duration);
    check(res, {
      'cities status is 200': (r) => r.status === 200,
    });

    sleep(0.2);
  });

  // Пользователи (см. /api/v1/users, /api/v1/users/{id})
  group('users', () => {
    let res = http.get(`${BASE_URL}/api/v1/users`);
    usersDuration.add(res.timings.duration);

    check(res, {
      'users status is 200': (r) => r.status === 200,
    });

    const users = safeJson(res, []);
    if (Array.isArray(users) && users.length > 0) {
      const user = users[Math.floor(Math.random() * users.length)];
      const userId = user.id || user.userId || 1;

      res = http.get(`${BASE_URL}/api/v1/users/${userId}`);
      usersDuration.add(res.timings.duration);
      check(res, {
        'user by id status is 200 or 404': (r) =>
          r.status === 200 || r.status === 404,
      });
    }

    sleep(0.2);
  });

  // Организации и типы организаций
  // (см. /api/v1/organization-types, /api/v1/organizations, /api/v1/organizations/{id})
  group('organizations', () => {
    let res = http.get(`${BASE_URL}/api/v1/organization-types`);
    organizationsDuration.add(res.timings.duration);
    check(res, {
      'organization-types status is 200': (r) => r.status === 200,
    });

    // Все организации (onlyApproved опционален)
    res = http.get(`${BASE_URL}/api/v1/organizations?onlyApproved=true`);
    organizationsDuration.add(res.timings.duration);
    check(res, {
      'organizations status is 200': (r) => r.status === 200,
    });

    const orgs = safeJson(res, []);
    if (Array.isArray(orgs) && orgs.length > 0) {
      const org = orgs[Math.floor(Math.random() * orgs.length)];
      const orgId = org.id || org.organizationId || 1;

      res = http.get(`${BASE_URL}/api/v1/organizations/${orgId}`);
      organizationsDuration.add(res.timings.duration);
      check(res, {
        'organization by id status is 200 or 404': (r) =>
          r.status === 200 || r.status === 404,
      });
    }

    sleep(0.2);
  });

  // Квесты и категории (по названиям из openapi спецификации: quests, categories)
  group('quests_and_categories', () => {
    // Категории квестов
    let res = http.get(`${BASE_URL}/api/v1/categories`);
    questsDuration.add(res.timings.duration);
    check(res, {
      'categories status is 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
    });

    // Список квестов
    res = http.get(`${BASE_URL}/api/v1/quests`);
    questsDuration.add(res.timings.duration);
    check(res, {
      'quests status is 200': (r) => r.status === 200,
    });

    const quests = safeJson(res, []);
    if (Array.isArray(quests) && quests.length > 0) {
      const quest = quests[Math.floor(Math.random() * quests.length)];
      const questId = quest.id || quest.questId || 1;

      // Детали квеста
      res = http.get(`${BASE_URL}/api/v1/quests/${questId}`);
      questsDuration.add(res.timings.duration);
      check(res, {
        'quest by id status is 200 or 404': (r) =>
          r.status === 200 || r.status === 404,
      });
    }

    sleep(0.2);
  });

  sleep(0.4);
}

/**
 * Безопасный парсинг JSON с дефолтным значением.
 */
function safeJson(res, def) {
  try {
    return res.json();
  } catch (e) {
    return def;
  }
}


