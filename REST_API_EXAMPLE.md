# Пример добавления REST API с axios

Если для курсовой работы нужно показать знание классического REST API подхода, можно добавить API routes в Next.js, сохранив Server Actions для внутренней логики.

## Структура: Гибридный подход

```
src/app/
├── actions/          # Server Actions (для внутренних операций)
│   ├── todos.ts
│   └── profile.ts
└── api/              # REST API (для внешних клиентов)
    ├── auth/
    │   └── [...nextauth]/route.ts
    └── todos/
        └── route.ts
```

## Пример: REST API для Todos

### 1. Создать API Route

**Файл: `src/app/api/todos/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/todos - получить все задачи пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const todos = await prisma.todo.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/todos - создать новую задачу
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валидация с Zod
    const schema = z.object({
      text: z.string().trim().min(1).max(200),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        text: parsed.data.text,
        userId: session.user.id,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. Создать API Route для отдельной задачи

**Файл: `src/app/api/todos/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// GET /api/todos/[id] - получить задачу по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const todo = await prisma.todo.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/todos/[id] - обновить задачу
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const schema = z.object({
      text: z.string().trim().min(1).max(200).optional(),
      completed: z.boolean().optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.updateMany({
      where: { id, userId: session.user.id },
      data: parsed.data,
    });

    if (todo.count === 0) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const updatedTodo = await prisma.todo.findFirst({
      where: { id },
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id] - удалить задачу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const todo = await prisma.todo.deleteMany({
      where: { id, userId: session.user.id },
    });

    if (todo.count === 0) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Использование с axios на клиенте

**Файл: `src/lib/api.ts`**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Перенаправление на страницу входа
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const todosApi = {
  // GET все задачи
  getAll: () => api.get('/todos'),

  // GET задача по ID
  getById: (id: string) => api.get(`/todos/${id}`),

  // POST создать задачу
  create: (text: string) => api.post('/todos', { text }),

  // PUT обновить задачу
  update: (id: string, data: { text?: string; completed?: boolean }) =>
    api.put(`/todos/${id}`, data),

  // DELETE удалить задачу
  delete: (id: string) => api.delete(`/todos/${id}`),
};

export default api;
```

### 4. Использование в компоненте

```typescript
"use client";

import { useState, useEffect } from 'react';
import { todosApi } from '@/lib/api';

export function TodosList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const response = await todosApi.getAll();
      setTodos(response.data);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (text: string) => {
    try {
      const response = await todosApi.create(text);
      setTodos([response.data, ...todos]);
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  // ... остальной код
}
```

## Сравнение подходов

### Server Actions (текущий)
```typescript
// Просто и типобезопасно
const [state, formAction] = useActionState(addTodoAction, initialState);

<form action={formAction}>
  <input name="text" />
  <button type="submit">Add</button>
</form>
```

### REST API + axios
```typescript
// Больше кода, но стандартный подход
const createTodo = async (text: string) => {
  await todosApi.create(text);
};
```

## Рекомендация

**Для курсовой работы:**
1. Оставьте Server Actions как основной подход
2. Добавьте REST API для демонстрации знания классического подхода
3. Объясните, когда использовать каждый подход:
   - Server Actions - для внутренних операций Next.js приложения
   - REST API - для внешних клиентов (мобильные приложения, другие сервисы)

**Для защиты:**
- Покажите оба подхода
- Объясните преимущества каждого
- Продемонстрируйте понимание архитектуры
