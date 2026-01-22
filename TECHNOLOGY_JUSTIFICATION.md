# Обоснование выбора технологий для курсовой работы

## Архитектура приложения

### Backend: Next.js (Node.js)

**Почему Next.js:**
1. **Full-stack фреймворк** - объединяет frontend и backend в одном проекте
2. **Server Actions** - современный подход к работе с серверной логикой без необходимости создания REST API
3. **TypeScript из коробки** - типобезопасность на всех уровнях
4. **Оптимизация производительности** - автоматический code splitting, SSR, SSG
5. **Активная экосистема** - большое сообщество и документация

**Альтернативы (и почему не выбраны):**
- **Express.js** - требует больше boilerplate кода, нет встроенной поддержки React
- **NestJS** - избыточен для данного проекта, больше подходит для enterprise приложений

---

## Работа с базой данных: Prisma ORM

### Что такое Prisma?
Prisma - это современный ORM (Object-Relational Mapping) для работы с базами данных.

### Почему Prisma, а не нативный SQL или другие ORM?

#### 1. **Типобезопасность**
```typescript
// Prisma генерирует типы автоматически из схемы
const user = await prisma.user.findUnique({
  where: { id: userId }
});
// TypeScript знает структуру user автоматически!
```

**Без Prisma (нативный SQL):**
```typescript
// Нет типобезопасности, легко ошибиться
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
// result - это any, нужно вручную типизировать
```

#### 2. **Миграции базы данных**
```bash
npx prisma migrate dev
```
- Автоматическое создание SQL миграций
- Версионирование схемы БД
- Откат изменений

#### 3. **Безопасность**
- Защита от SQL-инъекций из коробки
- Валидация данных на уровне схемы
- Автоматическое экранирование параметров

#### 4. **Удобство разработки**
```typescript
// Prisma - декларативный синтаксис
await prisma.todo.create({
  data: { text, userId }
});

// vs нативный SQL
await db.query(
  'INSERT INTO todos (text, "userId") VALUES ($1, $2) RETURNING *',
  [text, userId]
);
```

#### 5. **Prisma Studio** - визуальный редактор БД
```bash
npx prisma studio
```
- Просмотр и редактирование данных через веб-интерфейс
- Полезно для отладки и тестирования

### Альтернативы Prisma:

#### TypeORM
- ❌ Более сложная настройка
- ❌ Меньше типобезопасности
- ❌ Медленнее развивается

#### Sequelize
- ❌ Устаревший подход
- ❌ Меньше поддержки TypeScript
- ❌ Сложнее миграции

#### Нативный SQL (pg, mysql2)
- ❌ Нет типобезопасности
- ❌ Нужно писать миграции вручную
- ❌ Больше boilerplate кода
- ❌ Выше риск SQL-инъекций

---

## REST API vs Server Actions

### Текущий подход: Server Actions

**Что это:**
```typescript
// src/app/actions/todos.ts
"use server";

export async function addTodoAction(formData: FormData) {
  // Серверная логика напрямую в компоненте
  await prisma.todo.create({ data: { text, userId } });
}
```

**Преимущества:**
1. ✅ Меньше кода - не нужно создавать API routes
2. ✅ Типобезопасность - типы передаются автоматически
3. ✅ Производительность - меньше network overhead
4. ✅ Простота - один файл вместо нескольких (route + handler + types)

**Недостатки:**
1. ❌ Только для Next.js приложений
2. ❌ Нельзя использовать из других клиентов (мобильные приложения, внешние сервисы)

### Альтернатива: REST API с axios

**Если нужен REST API (для мобильного приложения или внешних клиентов):**

```typescript
// src/app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id }
  });

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json();

  const todo = await prisma.todo.create({
    data: {
      text: body.text,
      userId: session.user.id
    }
  });

  return NextResponse.json(todo, { status: 201 });
}
```

**Клиент с axios:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// GET todos
const todos = await api.get('/todos');

// POST todo
const newTodo = await api.post('/todos', { text: 'New task' });
```

---

## Рекомендация для курсовой работы

### Вариант 1: Оставить Server Actions (текущий подход)
**Обоснование:**
- Современный подход Next.js 13+
- Меньше кода, проще поддерживать
- Лучше производительность
- Подходит для full-stack Next.js приложений

**Для защиты:**
- Объяснить концепцию Server Actions
- Показать преимущества перед REST API
- Упомянуть, что это будущее веб-разработки

### Вариант 2: Добавить REST API (гибридный подход)
**Обоснование:**
- Server Actions для внутренних операций
- REST API для внешних клиентов (если планируется мобильное приложение)

**Для защиты:**
- Показать гибкость архитектуры
- Объяснить, когда использовать каждый подход
- Продемонстрировать знание обоих паттернов

---

## Итоговая таблица технологий

| Технология | Назначение | Почему выбрана |
|------------|-----------|----------------|
| **Next.js** | Full-stack фреймворк | Объединяет frontend и backend, современный подход |
| **Prisma** | ORM для БД | Типобезопасность, миграции, безопасность |
| **PostgreSQL** | База данных | Надежность, ACID, поддержка сложных запросов |
| **NextAuth** | Аутентификация | Готовая реализация, безопасность, JWT |
| **TypeScript** | Типизация | Безопасность типов, лучшая поддержка IDE |
| **Zod** | Валидация | Схемы валидации, типобезопасность |
| **Server Actions** | API слой | Меньше кода, типобезопасность, производительность |

---

## Для защиты курсовой работы

### Ключевые моменты:

1. **Prisma vs нативный SQL:**
   - "Выбрал Prisma для типобезопасности и удобства разработки"
   - "Автоматические миграции упрощают работу с БД"
   - "Защита от SQL-инъекций из коробки"

2. **Server Actions vs REST API:**
   - "Server Actions - современный подход Next.js"
   - "Меньше boilerplate кода"
   - "Лучшая производительность за счет меньшего network overhead"
   - "Если понадобится REST API для мобильного приложения - легко добавить"

3. **Архитектура:**
   - "Full-stack приложение на Next.js"
   - "Разделение на Server Actions для бизнес-логики"
   - "Prisma для работы с БД"
   - "NextAuth для аутентификации"

### Вопросы, которые могут задать:

**Q: Почему не использовали Express.js?**
A: Next.js предоставляет все необходимое из коробки, включая Server Actions, что упрощает разработку и уменьшает количество кода.

**Q: Почему Prisma, а не TypeORM?**
A: Prisma имеет лучшую типобезопасность, более простой синтаксис и активнее развивается. Prisma Studio - дополнительный инструмент для работы с БД.

**Q: Почему Server Actions, а не REST API?**
A: Для full-stack Next.js приложения Server Actions более эффективны. Если понадобится REST API (например, для мобильного приложения), его легко добавить через Next.js API Routes.

**Q: Можно ли использовать axios?**
A: Да, axios можно использовать на клиенте для запросов к REST API, если мы добавим API routes. Но для Server Actions axios не нужен - они вызываются напрямую.

---

## Заключение

Текущий стек технологий оптимален для данного проекта:
- **Prisma** - лучший выбор для работы с БД (типобезопасность, миграции)
- **Server Actions** - современный подход для Next.js приложений
- **Next.js** - full-stack фреймворк, объединяющий все компоненты

Если нужно добавить REST API для курсовой работы (чтобы показать знание классического подхода), это легко сделать, сохранив Server Actions для внутренней логики.
