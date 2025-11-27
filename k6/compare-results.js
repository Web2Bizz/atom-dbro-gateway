#!/usr/bin/env node

/**
 * Скрипт для сравнения результатов двух запусков k6
 * 
 * Использование:
 *   node compare-results.js baseline.json current.json
 *   node compare-results.js baseline.json current.json --format table
 *   node compare-results.js baseline.json current.json --format json
 */

const fs = require('fs');
const path = require('path');

// Парсинг аргументов командной строки
const args = process.argv.slice(2);
const format = args.includes('--format') 
  ? args[args.indexOf('--format') + 1] || 'table'
  : 'table';

const baselineFile = args.find(arg => arg.endsWith('.json') && !arg.startsWith('--'));
const currentFile = args.filter(arg => arg.endsWith('.json') && !arg.startsWith('--'))[1];

if (!baselineFile || !currentFile) {
  console.error('Использование: node compare-results.js <baseline.json> <current.json> [--format table|json]');
  process.exit(1);
}

// Нормализация путей (поддержка Windows с обратными слэшами)
// path.resolve автоматически нормализует пути и работает с относительными путями
const normalizePath = (filePath) => {
  // Если путь абсолютный, нормализуем его
  // Если относительный, разрешаем относительно текущей директории
  return path.isAbsolute(filePath) 
    ? path.normalize(filePath)
    : path.resolve(process.cwd(), path.normalize(filePath));
};

const baselinePath = normalizePath(baselineFile);
const currentPath = normalizePath(currentFile);

// Загрузка JSON файлов
function loadJson(file) {
  try {
    const filePath = normalizePath(file);
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Ошибка чтения файла ${file}:`, error.message);
    const attemptedPath = normalizePath(file);
    console.error(`Попытка чтения по пути: ${attemptedPath}`);
    process.exit(1);
  }
}

const baseline = loadJson(baselinePath);
const current = loadJson(currentPath);

// Извлечение метрик из k6 JSON результата
function extractMetrics(data) {
  if (!data || !data.metrics) {
    console.error('Неверный формат JSON. Ожидается объект с полем "metrics"');
    process.exit(1);
  }

  const metrics = data.metrics;
  const result = {};

  // HTTP метрики
  if (metrics.http_req_duration) {
    result.http_req_duration = {
      avg: metrics.http_req_duration.values.avg,
      min: metrics.http_req_duration.values.min,
      max: metrics.http_req_duration.values.max,
      p50: metrics.http_req_duration.values.med,
      p90: metrics.http_req_duration.values['p(90)'],
      p95: metrics.http_req_duration.values['p(95)'],
      p99: metrics.http_req_duration.values['p(99)'],
    };
  }

  if (metrics.http_req_failed) {
    result.http_req_failed = {
      rate: metrics.http_req_failed.values.rate,
      passes: metrics.http_req_failed.values.passes,
      fails: metrics.http_req_failed.values.fails,
    };
  }

  if (metrics.http_reqs) {
    result.http_reqs = {
      count: metrics.http_reqs.values.count,
      rate: metrics.http_reqs.values.rate,
    };
  }

  // VU метрики
  if (metrics.vus) {
    result.vus = {
      max: metrics.vus.values.max,
      min: metrics.vus.values.min,
    };
  }

  if (metrics.vus_max) {
    result.vus_max = {
      value: metrics.vus_max.values.value,
    };
  }

  // Кастомные метрики (если есть)
  Object.keys(metrics).forEach(key => {
    if (!['http_req_duration', 'http_req_failed', 'http_reqs', 'vus', 'vus_max', 'data_received', 'data_sent', 'iteration_duration', 'iterations'].includes(key)) {
      const metric = metrics[key];
      if (metric && metric.values) {
        result[key] = {
          avg: metric.values.avg,
          min: metric.values.min,
          max: metric.values.max,
          p95: metric.values['p(95)'],
          p99: metric.values['p(99)'],
        };
      }
    }
  });

  return result;
}

const baselineMetrics = extractMetrics(baseline);
const currentMetrics = extractMetrics(current);

// Вычисление разницы в процентах
function calculateDiff(baseline, current) {
  if (baseline === 0) return current === 0 ? 0 : Infinity;
  return ((current - baseline) / baseline) * 100;
}

// Форматирование числа
function formatNumber(num, decimals = 2) {
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';
  return num.toFixed(decimals);
}

function formatPercent(num) {
  if (typeof num !== 'number' || isNaN(num)) return 'N/A';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

// Сравнение метрик
function compareMetrics(baseline, current) {
  const comparison = {};

  Object.keys(current).forEach(key => {
    if (!baseline[key]) {
      comparison[key] = { status: 'new', current: current[key] };
      return;
    }

    const base = baseline[key];
    const curr = current[key];
    const diff = {};

    Object.keys(curr).forEach(subKey => {
      if (typeof curr[subKey] === 'number' && typeof base[subKey] === 'number') {
        const change = calculateDiff(base[subKey], curr[subKey]);
        diff[subKey] = {
          baseline: base[subKey],
          current: curr[subKey],
          change: change,
          status: Math.abs(change) < 5 ? 'ok' : change > 0 ? 'worse' : 'better',
        };
      } else {
        diff[subKey] = {
          baseline: base[subKey],
          current: curr[subKey],
        };
      }
    });

    comparison[key] = diff;
  });

  return comparison;
}

const comparison = compareMetrics(baselineMetrics, currentMetrics);

// Вывод результатов
if (format === 'json') {
  console.log(JSON.stringify({
    baseline: baselineMetrics,
    current: currentMetrics,
    comparison: comparison,
  }, null, 2));
} else {
  // Табличный формат
  console.log('\n' + '='.repeat(80));
  console.log('СРАВНЕНИЕ РЕЗУЛЬТАТОВ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ');
  console.log('='.repeat(80));
  console.log(`Базовый тест: ${path.basename(baselinePath)}`);
  console.log(`Текущий тест: ${path.basename(currentPath)}`);
  console.log('='.repeat(80) + '\n');

  // HTTP Request Duration
  if (comparison.http_req_duration) {
    console.log('📊 HTTP Request Duration (мс)');
    console.log('-'.repeat(80));
    const dur = comparison.http_req_duration;
    ['avg', 'p50', 'p90', 'p95', 'p99'].forEach(key => {
      if (dur[key]) {
        const { baseline, current, change, status } = dur[key];
        const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
        console.log(`  ${key.padEnd(6)}: ${formatNumber(baseline).padStart(10)} → ${formatNumber(current).padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon}`);
      }
    });
    console.log('');
  }

  // HTTP Request Failed
  if (comparison.http_req_failed) {
    console.log('❌ HTTP Request Failed Rate');
    console.log('-'.repeat(80));
    const failed = comparison.http_req_failed;
    if (failed.rate) {
      const { baseline, current, change, status } = failed.rate;
      const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
      const baselinePercent = (baseline * 100).toFixed(2) + '%';
      const currentPercent = (current * 100).toFixed(2) + '%';
      console.log(`  rate    : ${baselinePercent.padStart(10)} → ${currentPercent.padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon}`);
    }
    if (failed.fails) {
      const { baseline, current, change, status } = failed.fails;
      const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
      console.log(`  fails   : ${baseline.toString().padStart(10)} → ${current.toString().padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon}`);
    }
    console.log('');
  }

  // HTTP Requests
  if (comparison.http_reqs) {
    console.log('📈 HTTP Requests');
    console.log('-'.repeat(80));
    const reqs = comparison.http_reqs;
    if (reqs.count) {
      const { baseline, current, change, status } = reqs.count;
      const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
      console.log(`  count   : ${baseline.toString().padStart(10)} → ${current.toString().padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon}`);
    }
    if (reqs.rate) {
      const { baseline, current, change, status } = reqs.rate;
      const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
      console.log(`  rate    : ${formatNumber(baseline, 1).padStart(10)} → ${formatNumber(current, 1).padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon} req/s`);
    }
    console.log('');
  }

  // VUs
  if (comparison.vus) {
    console.log('👥 Virtual Users');
    console.log('-'.repeat(80));
    const vus = comparison.vus;
    if (vus.max) {
      const { baseline, current, change, status } = vus.max;
      const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
      console.log(`  max     : ${baseline.toString().padStart(10)} → ${current.toString().padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon}`);
    }
    console.log('');
  }

  // Кастомные метрики
  const customMetrics = Object.keys(comparison).filter(
    key => !['http_req_duration', 'http_req_failed', 'http_reqs', 'vus', 'vus_max'].includes(key)
  );

  if (customMetrics.length > 0) {
    console.log('🎯 Кастомные метрики');
    console.log('-'.repeat(80));
    customMetrics.forEach(key => {
      const metric = comparison[key];
      if (metric.p95) {
        const { baseline, current, change, status } = metric.p95;
        const statusIcon = status === 'better' ? '✅' : status === 'worse' ? '❌' : '➡️';
        console.log(`  ${key.padEnd(20)} p95: ${formatNumber(baseline).padStart(10)} → ${formatNumber(current).padStart(10)} (${formatPercent(change).padStart(8)}) ${statusIcon}`);
      }
    });
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('Легенда: ✅ улучшение | ❌ ухудшение | ➡️ без изменений (<5%)');
  console.log('='.repeat(80) + '\n');
}

