# Технические детали реализации

## Архитектура Frontend

### Структура папок

```
src/
├── app/                    # Маршруты и страницы (Next.js App Router)
│   ├── [locale]/          # Динамический сегмент для языков
│   │   ├── auth/          # Страницы аутентификации
│   │   │   ├── login/     # Страница входа
│   │   │   ├── register/  # Страница регистрации
│   │   │   └── forgot-password/ # Страница восстановления пароля
│   │   ├── profile/       # Страницы профиля
│   │   └── page.tsx        # Главная страница со списком задач
│   ├── actions/           # Server Actions (серверная логика)
│   │   ├── auth.ts        # Действия для аутентификации
│   │   ├── todos.ts       # Действия для работы с задачами
│   │   └── profile.ts     # Действия для профиля
│   └── api/               # API маршруты
│       └── auth/          # NextAuth API endpoints
├── components/            # React компоненты
│   ├── TodoApp.tsx        # Главный компонент списка задач
│   ├── LoginForm.tsx      # Форма входа
│   ├── RegisterForm.tsx   # Форма регистрации
│   ├── ForgotPasswordForm.tsx # Форма восстановления пароля
│   ├── ProfileForm.tsx    # Форма редактирования профиля
│   └── ...
├── lib/                   # Утилиты и библиотеки
│   ├── auth.ts            # Конфигурация NextAuth
│   ├── prisma.ts          # Клиент Prisma
│   └── password.ts        # Функции для работы с паролями
├── i18n/                  # Настройки интернационализации
│   ├── routing.ts         # Конфигурация маршрутизации
│   ├── request.ts         # Получение локали из запроса
│   └── navigation.ts      # Навигация с поддержкой языков
└── middleware.ts          # Middleware для защиты маршрутов
```

### Основные компоненты

#### TodoApp.tsx

Главный компонент приложения, отвечающий за отображение и управление задачами.

**Ответственности:**
- Отображение списка задач
- Форма создания новой задачи
- Редактирование существующих задач
- Удаление задач
- Фильтрация задач (все/активные/выполненные)
- Отображение статистики

**Состояние компонента:**
```typescript
const [addTodoState, addTodoFormAction] = useActionState(addTodoAction, { ok: false });
const [error, setError] = useState<string | null>(null);
const [editingId, setEditingId] = useState<string | null>(null);
const [editingText, setEditingText] = useState("");
const [editingDueDate, setEditingDueDate] = useState("");
const [editingPriority, setEditingPriority] = useState<TodoPriority>("MEDIUM");
const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
```

**Как работает создание задачи:**

1. Пользователь заполняет форму
2. При отправке формы вызывается `addTodoFormAction`
3. Данные отправляются на сервер через Server Action
4. После успешного создания форма сбрасывается
5. Список задач автоматически обновляется

**Как работает редактирование задачи:**

1. Пользователь нажимает кнопку "Редактировать"
2. Устанавливается `editingId` (ID редактируемой задачи)
3. Загружаются текущие значения задачи в состояние
4. Отображается форма редактирования вместо текста задачи
5. При сохранении вызывается `updateTodoAction`
6. После успешного обновления форма редактирования закрывается
7. Задача обновляется в списке

#### LoginForm.tsx

Компонент формы входа в систему.

**Как работает:**

1. Пользователь вводит email/username и пароль
2. При отправке формы вызывается `signIn` из NextAuth
3. NextAuth проверяет учетные данные
4. При успешной проверке создается сессия
5. Пользователь перенаправляется на главную страницу

#### RegisterForm.tsx

Компонент формы регистрации.

**Как работает:**

1. Пользователь заполняет форму (email, username, displayName, password)
2. При отправке вызывается `registerAction`
3. Сервер проверяет, что email и username уникальны
4. Пароль хешируется с помощью bcrypt
5. Создается новый пользователь в базе данных
6. Пользователь перенаправляется на страницу входа

### Управление состоянием

В проекте используется несколько подходов к управлению состоянием:

**1. Локальное состояние компонента (useState)**

Для данных, которые нужны только внутри одного компонента:
- Режим редактирования
- Текст редактируемой задачи
- Фильтр задач

**2. Server State (через Server Actions)**

Для данных, которые хранятся на сервере:
- Список задач
- Данные пользователя

**3. Сессия (NextAuth)**

Для данных аутентификации:
- Информация о текущем пользователе
- Статус авторизации

## Архитектура Backend

### Структура Server Actions

#### todos.ts

Файл содержит все действия для работы с задачами.

**addTodoAction** - создание новой задачи

```typescript
export async function addTodoAction(
  _prev: AddTodoState,
  formData: FormData,
): Promise<AddTodoState>
```

**Процесс выполнения:**

1. Проверка авторизации через `requireUserId()`
2. Получение данных из формы
3. Валидация текста задачи (не пустой, максимум 200 символов)
4. Валидация даты выполнения (не пустая, не в прошлом)
5. Валидация приоритета (один из трех значений)
6. Сохранение в базу данных через Prisma
7. Обновление кэша страницы через `revalidatePath`
8. Возврат результата (успех или ошибка)

**updateTodoAction** - обновление задачи

```typescript
export async function updateTodoAction(
  id: string,
  text: string,
  dueDate: string,
  priority: "IMPORTANT" | "MEDIUM" | "EASY"
)
```

**Процесс выполнения:**

1. Проверка авторизации
2. Валидация всех полей
3. Обновление записи в базе данных
4. Обновление кэша страницы
5. Возврат результата

**deleteTodoAction** - удаление задачи

```typescript
export async function deleteTodoAction(id: string)
```

**Процесс выполнения:**

1. Проверка авторизации
2. Удаление записи из базы данных (только если она принадлежит пользователю)
3. Обновление кэша страницы

**toggleTodoAction** - изменение статуса задачи

```typescript
export async function toggleTodoAction(id: string, completed: boolean)
```

**Процесс выполнения:**

1. Проверка авторизации
2. Обновление поля `completed` в базе данных
3. Обновление кэша страницы

#### auth.ts

Файл содержит действия для аутентификации.

**registerAction** - регистрация нового пользователя

**Процесс выполнения:**

1. Валидация данных формы (email, username, displayName, password)
2. Проверка, что email не занят
3. Проверка, что username не занят
4. Проверка совпадения паролей
5. Хеширование пароля через `hashPassword`
6. Создание пользователя в базе данных
7. Перенаправление на страницу входа

**findUserForPasswordReset** - поиск пользователя для восстановления пароля

**Процесс выполнения:**

1. Получение identifier (email или username) из формы
2. Поиск пользователя в базе данных
3. Если пользователь найден - возврат успеха
4. Если не найден - возврат ошибки (без указания причины для безопасности)

**resetPasswordAction** - сброс пароля

**Процесс выполнения:**

1. Повторная проверка пользователя (безопасность)
2. Валидация нового пароля
3. Проверка совпадения паролей
4. Хеширование нового пароля
5. Обновление пароля в базе данных
6. Возврат успеха

### Middleware

Middleware - это код, который выполняется перед обработкой каждого запроса.

**Файл:** `src/middleware.ts`

**Что делает:**

1. Обрабатывает интернационализацию (добавляет префикс языка к URL)
2. Проверяет, является ли страница публичной
3. Если страница защищена и пользователь не авторизован - перенаправляет на страницу входа
4. Если пользователь авторизован - пропускает запрос дальше

**Публичные страницы:**
- `/auth/login` - страница входа
- `/auth/register` - страница регистрации
- `/auth/forgot-password` - страница восстановления пароля

Все остальные страницы требуют авторизации.

## CRUD операции для списка задач

### Create (Создание)

**Frontend:**

```typescript
// src/components/TodoApp.tsx
<form action={addTodoFormAction}>
  <input name="text" />
  <input name="dueDate" type="date" />
  <select name="priority">
    <option value="IMPORTANT">Важная</option>
    <option value="MEDIUM">Средняя</option>
    <option value="EASY">Легкая</option>
  </select>
  <button type="submit">Добавить</button>
</form>
```

**Backend:**

```typescript
// src/app/actions/todos.ts
export async function addTodoAction(...) {
  // 1. Проверка авторизации
  const userId = await requireUserId();
  
  // 2. Валидация данных
  const text = validateText(formData.get("text"));
  const dueDate = validateDueDate(formData.get("dueDate"));
  const priority = validatePriority(formData.get("priority"));
  
  // 3. Сохранение в базу данных
  await prisma.todo.create({
    data: { text, dueDate, priority, userId },
  });
  
  // 4. Обновление кэша
  revalidatePath(`/${locale}`);
  
  return { ok: true };
}
```

**База данных:**

Prisma выполняет SQL запрос:
```sql
INSERT INTO "Todo" (text, "dueDate", priority, "userId", "completed", "createdAt", "updatedAt")
VALUES ('Текст задачи', '2026-01-30', 'MEDIUM', 'user_id', false, NOW(), NOW());
```

### Read (Чтение)

**Frontend:**

Данные загружаются автоматически при открытии страницы.

**Backend:**

```typescript
// src/app/[locale]/page.tsx
const todos = await prisma.todo.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
});
```

**База данных:**

Prisma выполняет SQL запрос:
```sql
SELECT * FROM "Todo" 
WHERE "userId" = 'user_id' 
ORDER BY "createdAt" DESC;
```

**Важно:** Запрос автоматически фильтруется по `userId`, поэтому пользователь видит только свои задачи.

### Update (Обновление)

**Frontend:**

```typescript
// При редактировании задачи
await updateTodoAction(
  todo.id,
  editingText,
  editingDueDate,
  editingPriority
);
```

**Backend:**

```typescript
// src/app/actions/todos.ts
export async function updateTodoAction(...) {
  const userId = await requireUserId();
  
  // Валидация данных
  // ...
  
  // Обновление в базе данных
  await prisma.todo.updateMany({
    where: { id, userId }, // Важно: проверка userId
    data: { text, dueDate, priority },
  });
  
  revalidatePath(`/${locale}`);
}
```

**База данных:**

Prisma выполняет SQL запрос:
```sql
UPDATE "Todo" 
SET text = 'Новый текст', "dueDate" = '2026-01-30', priority = 'IMPORTANT', "updatedAt" = NOW()
WHERE id = 'task_id' AND "userId" = 'user_id';
```

**Важно:** Использование `updateMany` с проверкой `userId` гарантирует, что пользователь может обновить только свои задачи.

### Delete (Удаление)

**Frontend:**

```typescript
// При нажатии кнопки "Удалить"
await deleteTodoAction(todo.id);
```

**Backend:**

```typescript
// src/app/actions/todos.ts
export async function deleteTodoAction(id: string) {
  const userId = await requireUserId();
  
  await prisma.todo.deleteMany({
    where: { id, userId }, // Важно: проверка userId
  });
  
  revalidatePath(`/${locale}`);
}
```

**База данных:**

Prisma выполняет SQL запрос:
```sql
DELETE FROM "Todo" 
WHERE id = 'task_id' AND "userId" = 'user_id';
```

**Важно:** Пользователь может удалить только свои задачи благодаря проверке `userId`.

## Аутентификация и авторизация

### Как работает вход в систему

**Шаг 1: Пользователь вводит данные**

В форме входа пользователь вводит:
- Email или username
- Пароль

**Шаг 2: Отправка данных**

```typescript
// src/components/LoginForm.tsx
const res = await signIn("credentials", {
  identifier,
  password,
  redirect: false,
});
```

**Шаг 3: Проверка на сервере**

```typescript
// src/lib/auth.ts
async authorize(raw) {
  // 1. Парсинг данных
  const { identifier, password } = parsed.data;
  
  // 2. Поиск пользователя
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
  });
  
  // 3. Проверка пароля
  const ok = await verifyPassword(password, user.passwordHash);
  
  // 4. Возврат данных пользователя (без пароля!)
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}
```

**Шаг 4: Создание JWT токена**

NextAuth создает JWT токен, который содержит:
- ID пользователя
- Email
- Username
- DisplayName
- AvatarUrl

**Важно:** Пароль никогда не включается в токен!

**Шаг 5: Сохранение токена**

Токен сохраняется в браузере в виде защищенной cookie.

**Шаг 6: Использование токена**

При каждом запросе к защищенной странице:
1. Middleware проверяет наличие токена
2. Если токен валиден - запрос проходит
3. Если токена нет или он невалиден - редирект на страницу входа

### Как работает регистрация

**Шаг 1: Пользователь заполняет форму**

- Email
- Username
- Display Name
- Password
- Confirm Password

**Шаг 2: Валидация на клиенте**

Проверка:
- Email имеет правильный формат
- Username не менее 3 символов
- Display Name не пустой
- Пароль не менее 6 символов
- Пароли совпадают

**Шаг 3: Валидация на сервере**

Повторная проверка всех полей (безопасность).

**Шаг 4: Проверка уникальности**

```typescript
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  return { ok: false, formError: "Email уже занят" };
}
```

**Шаг 5: Хеширование пароля**

```typescript
// src/lib/password.ts
export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}
```

**Что происходит:**
- Пароль преобразуется в хеш (необратимое преобразование)
- Добавляется "соль" (случайные данные) для безопасности
- Используется 12 раундов хеширования (медленно для защиты от перебора)

**Пример:**
```
Пароль: "mypassword123"
Хеш: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY..."
```

**Важно:** Из хеша невозможно восстановить исходный пароль!

**Шаг 6: Создание пользователя**

```typescript
await prisma.user.create({
  data: {
    email: email.toLowerCase(),
    username,
    displayName,
    passwordHash, // Сохраняется хеш, а не пароль!
  },
});
```

**Шаг 7: Перенаправление на страницу входа**

После успешной регистрации пользователь перенаправляется на страницу входа.

### Как работает восстановление пароля

**Шаг 1: Поиск пользователя**

Пользователь вводит email или username.

```typescript
// src/app/actions/auth.ts
const user = await prisma.user.findFirst({
  where: {
    OR: [
      { email: identifier.toLowerCase() },
      { username: identifier },
    ],
  },
});
```

**Важно для безопасности:** Если пользователь не найден, возвращается общее сообщение об ошибке. Это предотвращает перебор email/username.

**Шаг 2: Ввод нового пароля**

Если пользователь найден, показывается форма для ввода нового пароля.

**Шаг 3: Валидация нового пароля**

- Минимум 6 символов
- Пароли должны совпадать

**Шаг 4: Хеширование нового пароля**

```typescript
const passwordHash = await hashPassword(newPassword);
```

**Шаг 5: Обновление пароля в базе данных**

```typescript
await prisma.user.update({
  where: { id: user.id },
  data: { passwordHash },
});
```

**Важно:** Старый пароль полностью заменяется новым. Старый пароль больше не работает.

**Шаг 6: Перенаправление на страницу входа**

Пользователь может войти с новым паролем.

### Защита маршрутов

**Как работает Middleware:**

```typescript
// src/middleware.ts
export default auth((req) => {
  // 1. Обработка языков
  const intlResponse = intlMiddleware(req);
  
  // 2. Проверка, публичная ли страница
  const pathnameWithoutLocale = stripLocale(req.nextUrl.pathname);
  const isPublic = publicPages.includes(pathnameWithoutLocale);
  
  if (isPublic) return intlResponse;
  
  // 3. Проверка авторизации
  if (!req.auth) {
    // Перенаправление на страницу входа
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
  }
  
  return intlResponse;
});
```

**Что происходит:**

1. Пользователь пытается открыть защищенную страницу
2. Middleware проверяет наличие токена авторизации
3. Если токена нет - редирект на `/auth/login`
4. Если токен есть и валиден - доступ разрешен

**Защищенные страницы:**
- `/` - главная страница со списком задач
- `/profile` - страница профиля
- Все остальные страницы кроме публичных

**Публичные страницы:**
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`

## Защита данных

### Как защищаются пароли

**1. Хеширование**

Пароли никогда не хранятся в открытом виде. Используется алгоритм bcrypt:

```typescript
// При регистрации
const passwordHash = await hashPassword("мой_пароль");
// Результат: "$2a$12$LQv3c1yqBWVHxkd0LHAkCO..."

// При входе
const isValid = await verifyPassword("мой_пароль", passwordHash);
// Сравнивает введенный пароль с хешем
```

**2. Соль (Salt)**

Каждый пароль хешируется с уникальной "солью", что делает невозможным использование предвычисленных таблиц хешей (rainbow tables).

**3. Медленное хеширование**

bcrypt намеренно медленный (12 раундов), что защищает от перебора паролей методом грубой силы.

### Как защищаются задачи пользователей

**1. Фильтрация по userId**

Все запросы к базе данных автоматически фильтруются по `userId`:

```typescript
// Пользователь видит только свои задачи
const todos = await prisma.todo.findMany({
  where: { userId }, // Только задачи текущего пользователя
});
```

**2. Проверка при обновлении/удалении**

```typescript
// Пользователь может обновить только свои задачи
await prisma.todo.updateMany({
  where: { id, userId }, // Двойная проверка
  data: { ... },
});
```

**3. Middleware защита**

Неавторизованные пользователи не могут получить доступ к страницам с задачами.

### Валидация данных

**Двухуровневая валидация:**

**1. Клиентская валидация (для удобства)**

```typescript
// Быстрая проверка перед отправкой
if (!dueDateInput.value) {
  e.preventDefault();
  setError("Срок выполнения обязателен");
  return;
}
```

**2. Серверная валидация (для безопасности)**

```typescript
// Обязательная проверка на сервере
const dueDateString = String(formData.get("dueDate") ?? "").trim();
if (!dueDateString) {
  return {
    ok: false,
    fieldErrors: { dueDate: ["Срок выполнения обязателен"] },
  };
}
```

**Почему нужна серверная валидация?**

Злоумышленник может отправить запрос напрямую на сервер, минуя клиентскую валидацию. Серверная валидация гарантирует безопасность.

## Резюме технических деталей

**Frontend:**
- React компоненты для интерфейса
- Server Actions для связи с сервером
- Управление состоянием через React hooks
- Автоматическое обновление через revalidatePath

**Backend:**
- Server Actions для обработки запросов
- Prisma для работы с базой данных
- NextAuth для аутентификации
- Middleware для защиты маршрутов

**Безопасность:**
- Пароли хешируются с bcrypt
- Данные фильтруются по userId
- Двухуровневая валидация
- Защита маршрутов через middleware

Все эти механизмы работают вместе, создавая безопасное и функциональное приложение.
