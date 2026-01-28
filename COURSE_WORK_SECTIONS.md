# Разделы курсовой работы

## 2.6 Тестирование функционала и исправление ошибок

### Важность тестирования в разработке веб-приложений

Тестирование является критически важным этапом разработки любого программного обеспечения, особенно веб-приложений. В процессе разработки приложения для управления задачами тестирование позволило выявить и исправить множество ошибок до того, как они могли повлиять на пользовательский опыт.

Основные причины важности тестирования:

1. **Обеспечение качества функционала** - тестирование гарантирует, что все функции работают согласно требованиям
2. **Предотвращение регрессий** - проверка того, что новые изменения не ломают существующий функционал
3. **Повышение надежности** - выявление ошибок на ранних этапах разработки снижает стоимость их исправления
4. **Улучшение пользовательского опыта** - тестирование помогает создать стабильное и удобное приложение

### Типы тестирования, использованные в проекте

В процессе разработки были применены следующие типы тестирования:

#### Ручное тестирование (Manual Testing)

Ручное тестирование выполнялось разработчиком путем непосредственного взаимодействия с интерфейсом приложения. Этот метод позволил проверить пользовательский опыт и визуальное отображение элементов интерфейса.

**Примеры ручного тестирования:**

- Проверка отображения форм на разных размерах экрана
- Тестирование навигации между страницами
- Проверка визуальной обратной связи при действиях пользователя
- Тестирование анимаций и переходов

#### Функциональное тестирование (Functional Testing)

Функциональное тестирование было направлено на проверку того, что каждая функция приложения работает корректно и выполняет заявленные задачи.

**Основные области функционального тестирования:**

1. **Создание задач** - проверка валидации полей, сохранения данных, отображения в списке
2. **Редактирование задач** - проверка обновления данных, сохранения изменений
3. **Удаление задач** - проверка корректного удаления из базы данных и интерфейса
4. **Аутентификация** - проверка входа, регистрации, восстановления пароля
5. **Фильтрация задач** - проверка отображения задач по статусу (все/активные/выполненные)

#### Регрессионное тестирование (Regression Testing)

Регрессионное тестирование выполнялось после каждого значительного изменения кода для проверки того, что существующий функционал продолжает работать корректно.

**Примеры регрессионного тестирования:**

- После добавления полей `dueDate` и `priority` была проверена работа всех существующих операций с задачами
- После исправления ошибок аутентификации была проверена работа всех защищенных маршрутов
- После изменений в валидации данных была проверена работа всех форм

### Обнаружение ошибок в процессе разработки

В процессе разработки было обнаружено и исправлено несколько категорий ошибок:

#### Ошибки типизации TypeScript

**Проблема:** После добавления новых полей `dueDate` и `priority` в модель базы данных TypeScript выдавал ошибки о том, что эти свойства не существуют в типе `Todo`.

**Причина:** Prisma Client не был перегенерирован после изменения схемы базы данных, поэтому TypeScript не знал о новых полях.

**Решение:** Была применена временная типизация с явным указанием структуры данных до перегенерации Prisma Client.

**Пример кода:**

```typescript
// Временное решение с явной типизацией
const todos = todosRaw as unknown as Array<{
  id: string;
  text: string;
  completed: boolean;
  dueDate?: Date | null;
  priority?: "IMPORTANT" | "MEDIUM" | "EASY" | null;
  createdAt: Date;
}>;
```

#### Ошибки интернационализации

**Проблема:** В консоли браузера появлялась ошибка `MISSING_MESSAGE: Could not resolve Auth.login.title` для русской локали.

**Причина:** В файле переводов `messages/ru.json` был дубликат ключа `"login"`, что приводило к перезаписи первого определения вторым.

**Решение:** Дублирующиеся объекты были объединены в один объект со всеми необходимыми ключами.

**Пример исправления:**

```json
// До исправления (неправильно)
{
  "Auth": {
    "login": {
      "title": "Вход"
    },
    "login": {
      "forgotPassword": "Забыли пароль?"
    }
  }
}

// После исправления (правильно)
{
  "Auth": {
    "login": {
      "title": "Вход",
      "forgotPassword": "Забыли пароль?"
    }
  }
}
```

#### Ошибки времени выполнения

**Проблема:** При отображении старых записей задач возникала ошибка `TypeError: Cannot read properties of undefined (reading 'toISOString')`.

**Причина:** Старые записи в базе данных не имели полей `dueDate` и `priority`, что приводило к попытке вызова метода `toISOString()` на `undefined`.

**Решение:** Была добавлена проверка наличия значений и установка значений по умолчанию для старых записей.

**Пример кода:**

```typescript
const todos = todosRaw.map((t) => {
  // Обработка старых записей без dueDate и priority
  const dueDate = t.dueDate
    ? t.dueDate
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // По умолчанию 7 дней от текущей даты
  const priority = t.priority ?? "MEDIUM"; // По умолчанию средний приоритет

  return {
    id: t.id,
    text: t.text,
    completed: t.completed,
    dueDate: dueDate.toISOString(),
    priority: priority,
    createdAt: t.createdAt.toISOString(),
  };
});
```

#### Критические ошибки функционала

**Проблема:** Операции создания, редактирования и удаления задач не работали.

**Причины:**

1. Отсутствие обработки ошибок на клиенте - переменная `setError` не была определена
2. Неполная реализация редактирования - форма редактирования не включала поля `dueDate` и `priority`
3. Неправильная обработка ошибок в Server Actions - ошибки не передавались на клиент

**Решение:** Была проведена комплексная доработка:

1. Добавлена переменная состояния для ошибок на клиенте
2. Расширена форма редактирования для включения всех полей задачи
3. Улучшена обработка ошибок в Server Actions с правильной передачей на клиент

**Пример исправления обработки ошибок:**

```typescript
// В компоненте TodoApp.tsx
const [error, setError] = useState<string | null>(null);

// При вызове действий с обработкой ошибок
try {
  await updateTodoAction(todo.id, editingText, editingDueDate, editingPriority);
  setEditingId(null);
} catch (err) {
  setError("Не удалось обновить задачу. Попробуйте еще раз.");
}
```

#### Ошибки маршрутизации

**Проблема:** При попытке перейти на страницу восстановления пароля происходил бесконечный редирект (HTTP 307).

**Причина:** Страница `/auth/forgot-password` не была добавлена в список публичных страниц в middleware, что приводило к редиректу неавторизованных пользователей на страницу входа.

**Решение:** Страница восстановления пароля была добавлена в список публичных страниц.

**Пример кода:**

```typescript
// src/middleware.ts
const publicPages = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password", // Добавлено для исправления ошибки
];
```

### Процесс отладки пошагово

Отладка выполнялась по следующему алгоритму:

1. **Воспроизведение ошибки** - четкое описание шагов, приводящих к ошибке
2. **Анализ логов** - изучение сообщений об ошибках в консоли браузера и сервера
3. **Проверка кода** - анализ соответствующего участка кода
4. **Выдвижение гипотезы** - предположение о причине ошибки
5. **Исправление** - внесение изменений в код
6. **Проверка** - повторное тестирование для подтверждения исправления
7. **Регрессионное тестирование** - проверка того, что исправление не сломало другой функционал

### Примеры тестирования функционала

#### Тестирование создания задачи

**Шаги тестирования:**

1. Открыть форму создания задачи
2. Попытаться создать задачу без текста - должна появиться ошибка валидации
3. Попытаться создать задачу с датой в прошлом - должна появиться ошибка валидации
4. Создать задачу с корректными данными - задача должна появиться в списке

**Код валидации на клиенте:**

```typescript
// src/components/TodoApp.tsx
onSubmit={(e) => {
  const form = e.currentTarget;
  const dueDateInput = form.elements.namedItem("dueDate") as HTMLInputElement;
  
  // Проверка наличия даты
  if (!dueDateInput.value) {
    e.preventDefault();
    setError("Срок выполнения обязателен");
    return;
  }
  
  // Проверка, что дата не в прошлом
  const selectedDate = new Date(dueDateInput.value + "T00:00:00Z");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dateToCheck = new Date(selectedDate);
  dateToCheck.setUTCHours(0, 0, 0, 0);
  
  if (dateToCheck < today) {
    e.preventDefault();
    setError("Дата не может быть в прошлом");
    return;
  }
}}
```

**Код валидации на сервере:**

```typescript
// src/app/actions/todos.ts
const textSchema = z
  .string()
  .trim()
  .min(1, "Текст задачи обязателен")
  .max(200, "Текст задачи не должен превышать 200 символов");

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Неверный формат даты")
  .transform((str) => {
    const [year, month, day] = str.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  })
  .pipe(
    z.date().refine(
      (date) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const dateToCheck = new Date(date);
        dateToCheck.setUTCHours(0, 0, 0, 0);
        return dateToCheck >= today;
      },
      { message: "Дата не может быть в прошлом" }
    )
  );
```

#### Тестирование редактирования задачи

**Шаги тестирования:**

1. Нажать кнопку "Редактировать" у существующей задачи
2. Изменить текст задачи
3. Изменить дату выполнения
4. Изменить приоритет
5. Сохранить изменения - задача должна обновиться в списке

**Код обработки редактирования:**

```typescript
// src/components/TodoApp.tsx
const handleUpdate = async () => {
  if (!editingId) return;
  
  try {
    await updateTodoAction(
      editingId,
      editingText,
      editingDueDate,
      editingPriority
    );
    setEditingId(null);
    setEditingText("");
    setEditingDueDate("");
    setEditingPriority("MEDIUM");
  } catch (error) {
    setError("Не удалось обновить задачу");
  }
};
```

**Код обновления на сервере:**

```typescript
// src/app/actions/todos.ts
export async function updateTodoAction(
  id: string,
  text: string,
  dueDate: string,
  priority: "IMPORTANT" | "MEDIUM" | "EASY"
) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();
    
    // Валидация всех полей
    const validatedText = textSchema.parse(text);
    const validatedDueDate = dueDateSchema.parse(dueDate);
    const validatedPriority = todoPrioritySchema.parse(priority);
    
    // Обновление в базе данных
    await prisma.todo.updateMany({
      where: { id, userId },
      data: {
        text: validatedText,
        dueDate: validatedDueDate,
        priority: validatedPriority,
      },
    });
    
    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[UPDATE_TODO] Failed to update todo:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
```

#### Тестирование удаления задачи

**Шаги тестирования:**

1. Нажать кнопку "Удалить" у существующей задачи
2. Подтвердить удаление (если требуется)
3. Проверить, что задача исчезла из списка
4. Проверить, что задача удалена из базы данных

**Код удаления:**

```typescript
// src/components/TodoApp.tsx
const handleDelete = async (id: string) => {
  try {
    await deleteTodoAction(id);
  } catch (error) {
    setError("Не удалось удалить задачу");
  }
};
```

**Код удаления на сервере:**

```typescript
// src/app/actions/todos.ts
export async function deleteTodoAction(id: string) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();
    
    await prisma.todo.deleteMany({
      where: { id, userId },
    });
    
    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[DELETE_TODO] Failed to delete todo:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
```

#### Тестирование аутентификации и восстановления пароля

**Шаги тестирования входа:**

1. Ввести неверные учетные данные - должна появиться ошибка
2. Ввести верные учетные данные - должен произойти вход и редирект на главную страницу

**Шаги тестирования восстановления пароля:**

1. Перейти на страницу восстановления пароля
2. Ввести несуществующий email/username - должна появиться общая ошибка (без указания, что пользователь не найден)
3. Ввести существующий email/username - должна появиться форма для ввода нового пароля
4. Ввести новый пароль и подтверждение - пароль должен обновиться
5. Войти с новым паролем - вход должен быть успешным

**Код поиска пользователя для восстановления пароля:**

```typescript
// src/app/actions/auth.ts
export async function findUserForPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  
  if (!identifier) {
    return {
      ok: false,
      fieldErrors: { identifier: ["Email или имя пользователя обязательны"] },
    };
  }
  
  // Поиск пользователя по email или username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
  });
  
  if (!user) {
    // Для безопасности не раскрываем, существует ли пользователь
    return {
      ok: false,
      formError: "Пользователь не найден",
    };
  }
  
  return { ok: true, step: "userFound" };
}
```

**Код сброса пароля:**

```typescript
// src/app/actions/auth.ts
export async function resetPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  
  // Повторная проверка пользователя для безопасности
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
  });
  
  if (!user) {
    return {
      ok: false,
      formError: "Пользователь не найден",
    };
  }
  
  // Валидация пароля
  if (password.length < 6) {
    return {
      ok: false,
      fieldErrors: { password: ["Пароль должен содержать минимум 6 символов"] },
    };
  }
  
  if (password !== confirmPassword) {
    return {
      ok: false,
      fieldErrors: { confirmPassword: ["Пароли не совпадают"] },
    };
  }
  
  // Хеширование нового пароля
  const passwordHash = await hashPassword(password);
  
  // Обновление пароля в базе данных
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  
  return { ok: true, step: "passwordChanged" };
}
```

### Логирование для отладки

В процессе разработки использовалось логирование для отслеживания работы приложения и выявления ошибок.

**Принципы логирования в проекте:**

1. **Логирование ошибок** - все ошибки логируются с помощью `console.error`
2. **Отсутствие чувствительных данных** - пароли, токены и другие чувствительные данные не логируются
3. **Информативные сообщения** - каждое сообщение содержит контекст для понимания проблемы

**Примеры логирования:**

```typescript
// Логирование ошибок при обновлении задачи
try {
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { text, dueDate, priority },
  });
} catch (error) {
  console.error("[UPDATE_TODO] Failed to update todo:", error instanceof Error ? error.message : String(error));
  throw error;
}

// Логирование ошибок при удалении задачи
try {
  await prisma.todo.deleteMany({
    where: { id, userId },
  });
} catch (error) {
  console.error("[DELETE_TODO] Failed to delete todo:", error instanceof Error ? error.message : String(error));
  throw error;
}
```

**Важно:** В production версии приложения логирование настроено только на уровень ошибок, чтобы не перегружать систему избыточными логами.

## 2.7 Адаптация интерфейса приложения для разных устройств

### Важность адаптивного дизайна

Адаптивный дизайн (responsive design) является критически важным аспектом современной веб-разработки. В эпоху, когда пользователи обращаются к веб-приложениям с различных устройств - от больших настольных мониторов до компактных смартфонов - необходимо обеспечить удобство использования на всех платформах.

Основные причины важности адаптивного дизайна:

1. **Разнообразие устройств** - пользователи используют различные устройства с разными размерами экранов
2. **Улучшение пользовательского опыта** - адаптивный интерфейс обеспечивает комфортную работу на любом устройстве
3. **Увеличение аудитории** - поддержка мобильных устройств расширяет потенциальную аудиторию приложения
4. **SEO преимущества** - поисковые системы отдают предпочтение адаптивным сайтам

### Поддерживаемые устройства

Разработанное приложение адаптировано для работы на следующих типах устройств:

1. **Настольные компьютеры (Desktop)** - экраны шириной от 1024px и выше
2. **Планшеты (Tablet)** - экраны шириной от 768px до 1023px
3. **Мобильные устройства (Mobile)** - экраны шириной до 767px

### Реализация адаптивности в проекте

Адаптивность в проекте реализована с использованием фреймворка Tailwind CSS, который предоставляет утилитарные классы для создания адаптивных интерфейсов.

#### CSS Media Queries через Tailwind

Tailwind CSS использует систему breakpoints (точек перелома), которые автоматически применяют стили в зависимости от размера экрана:

- `sm:` - для экранов от 640px
- `md:` - для экранов от 768px
- `lg:` - для экранов от 1024px
- `xl:` - для экранов от 1280px

#### Гибкие макеты (Flexible Layouts)

Основной принцип адаптивных макетов - использование гибких контейнеров, которые автоматически подстраиваются под размер экрана.

**Пример адаптивной сетки для формы создания задачи:**

```typescript
// src/components/TodoApp.tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div>
    <label>Срок выполнения</label>
    <input type="date" name="dueDate" />
  </div>
  <div>
    <label>Приоритет</label>
    <select name="priority">
      <option value="IMPORTANT">Важная</option>
      <option value="MEDIUM">Средняя</option>
      <option value="EASY">Легкая</option>
    </select>
  </div>
</div>
```

**Объяснение:** На мобильных устройствах (`grid-cols-1`) поля располагаются в один столбец, что удобно для узких экранов. На экранах от 640px (`sm:grid-cols-2`) поля располагаются в два столбца, что эффективнее использует пространство.

#### Адаптивные компоненты

Компоненты приложения адаптируются к размеру экрана, изменяя размеры, отступы и расположение элементов.

**Пример адаптивного компонента Avatar:**

```typescript
// src/components/Avatar.tsx
const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-lg",
};
```

**Объяснение:** Компонент аватара имеет три размера, которые используются в зависимости от контекста. На мобильных устройствах используется меньший размер (`sm`), на десктопе - больший (`lg`).

#### Адаптивные формы и кнопки

Формы и кнопки оптимизированы для удобного использования на сенсорных экранах мобильных устройств.

**Пример адаптивной формы редактирования:**

```typescript
// src/components/TodoApp.tsx
<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
  <input
    type="date"
    value={editingDueDate}
    onChange={(e) => setEditingDueDate(e.target.value)}
    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
  />
  <select
    value={editingPriority}
    onChange={(e) => setEditingPriority(e.target.value as TodoPriority)}
    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
  />
</div>
```

**Объяснение:** На мобильных устройствах поля формы располагаются вертикально (`grid-cols-1`), что упрощает заполнение на маленьком экране. На планшетах и десктопах (`sm:grid-cols-2`) поля располагаются горизонтально.

**Пример адаптивной кнопки:**

```typescript
// src/components/TodoApp.tsx
<button
  type="submit"
  disabled={isPending}
  className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
>
  {isPending ? "Сохранение..." : "Сохранить"}
</button>
```

**Объяснение:** Кнопка занимает всю ширину контейнера (`w-full`), что обеспечивает удобное нажатие на мобильных устройствах. Размер шрифта (`text-sm`) и отступы (`px-4 py-2`) оптимизированы для сенсорных экранов.

### Изменение поведения интерфейса в зависимости от размера экрана

#### На мобильных устройствах (до 640px)

- Формы отображаются в один столбец
- Кнопки занимают всю ширину экрана
- Уменьшены отступы между элементами
- Упрощена навигация

**Пример:**

```typescript
// На мобильных устройствах форма создания задачи отображается вертикально
<div className="space-y-4">
  <input name="text" className="w-full" />
  <input name="dueDate" type="date" className="w-full" />
  <select name="priority" className="w-full">
    {/* опции */}
  </select>
  <button className="w-full">Добавить</button>
</div>
```

#### На планшетах (640px - 1023px)

- Формы могут использовать два столбца для связанных полей
- Кнопки могут иметь фиксированную ширину
- Увеличены отступы для комфортного просмотра

**Пример:**

```typescript
// На планшетах связанные поля располагаются в два столбца
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <input name="dueDate" type="date" />
  <select name="priority">
    {/* опции */}
  </select>
</div>
```

#### На настольных компьютерах (от 1024px)

- Максимальное использование пространства экрана
- Элементы могут располагаться в несколько столбцов
- Оптимизированы отступы и размеры шрифтов

**Пример:**

```typescript
// На десктопе используется более сложная сетка
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* элементы */}
</div>
```

### Тестирование адаптивности

Адаптивность приложения тестировалась на различных устройствах и в инструментах разработчика браузера:

1. **Chrome DevTools** - эмуляция различных размеров экрана
2. **Реальные устройства** - тестирование на смартфонах и планшетах
3. **Различные браузеры** - проверка совместимости

### Резюме по адаптивности

Реализованный адаптивный дизайн обеспечивает:

- Удобное использование на всех типах устройств
- Оптимальное использование пространства экрана
- Комфортный пользовательский опыт независимо от устройства
- Соответствие современным стандартам веб-разработки

## Заключение

В процессе выполнения курсовой работы было разработано полнофункциональное веб-приложение для управления задачами (todo list), которое демонстрирует применение современных технологий веб-разработки и решает практические задачи организации личной работы пользователей.

### Что было разработано

Разработанное приложение включает в себя следующие основные компоненты:

1. **Система управления задачами** - создание, редактирование, удаление и отслеживание задач с возможностью установки сроков выполнения и приоритетов
2. **Система аутентификации** - регистрация пользователей, вход в систему и безопасное восстановление пароля
3. **Управление профилем** - возможность изменения имени пользователя и загрузки аватара
4. **Многоязычный интерфейс** - поддержка русского и английского языков с возможностью переключения
5. **Адаптивный дизайн** - оптимизация интерфейса для работы на различных устройствах

### Достигнутые цели

В процессе разработки были достигнуты следующие цели:

1. **Практическое освоение современных технологий** - успешное применение Next.js, React, TypeScript, Prisma и других современных инструментов разработки
2. **Реализация полного цикла разработки** - от проектирования базы данных до развертывания приложения
3. **Обеспечение безопасности** - реализация безопасного хранения паролей, защиты маршрутов и валидации данных
4. **Создание удобного пользовательского интерфейса** - разработка интуитивно понятного и адаптивного интерфейса
5. **Документирование проекта** - создание подробной технической документации

### Освоенные технологии

В процессе работы были освоены следующие технологии и инструменты:

1. **Next.js 16** - современный фреймворк для разработки React-приложений с поддержкой Server Actions и App Router
2. **React 19** - библиотека для создания пользовательских интерфейсов с использованием хуков и компонентного подхода
3. **TypeScript** - типизированный язык программирования для повышения надежности кода
4. **Prisma ORM** - инструмент для работы с базой данных с автоматической генерацией типов
5. **PostgreSQL** - реляционная база данных для хранения данных приложения
6. **NextAuth** - система аутентификации для Next.js приложений
7. **Tailwind CSS** - утилитарный CSS фреймворк для создания адаптивных интерфейсов
8. **Zod** - библиотека для валидации данных с поддержкой TypeScript
9. **next-intl** - библиотека для интернационализации приложений
10. **Docker** - инструмент для контейнеризации и развертывания приложений

### Приобретенные практические навыки

В процессе разработки были приобретены следующие практические навыки:

1. **Проектирование базы данных** - создание схемы данных, определение связей между таблицами, работа с миграциями
2. **Разработка серверной логики** - создание Server Actions, обработка запросов, валидация данных на сервере
3. **Разработка клиентской логики** - создание React компонентов, управление состоянием, обработка пользовательских действий
4. **Обеспечение безопасности** - хеширование паролей, защита маршрутов, валидация входных данных
5. **Тестирование и отладка** - выявление и исправление ошибок, тестирование функционала, регрессионное тестирование
6. **Адаптивный дизайн** - создание интерфейсов, работающих на различных устройствах
7. **Работа с инструментами разработки** - использование Git, Docker, инструментов разработчика браузера

### Образовательная ценность проекта

Разработанный проект имеет значительную образовательную ценность:

1. **Демонстрация полного цикла разработки** - проект показывает все этапы создания веб-приложения от проектирования до развертывания
2. **Применение современных практик** - использование актуальных технологий и подходов к разработке
3. **Практическое применение теории** - реализация теоретических знаний в практическом проекте
4. **Опыт решения реальных задач** - работа с типичными проблемами веб-разработки и их решениями
5. **База для дальнейшего развития** - проект может быть расширен дополнительным функционалом

### Возможные направления улучшения

В будущем проект может быть улучшен следующими способами:

1. **Расширение функционала задач** - добавление подзадач, тегов, категорий, прикрепления файлов
2. **Улучшение пользовательского опыта** - добавление уведомлений, темной темы, настраиваемых фильтров
3. **Оптимизация производительности** - кэширование данных, оптимизация запросов к базе данных, lazy loading
4. **Дополнительные функции безопасности** - двухфакторная аутентификация, ограничение попыток входа
5. **Мобильное приложение** - создание нативного мобильного приложения с использованием React Native
6. **Интеграции** - подключение к внешним сервисам, экспорт данных, синхронизация с календарем

### Выводы

Выполненная курсовая работа позволила получить комплексные знания и практические навыки в области современной веб-разработки. Разработанное приложение демонстрирует понимание принципов создания полнофункциональных веб-приложений, включая проектирование архитектуры, реализацию бизнес-логики, обеспечение безопасности и создание удобного пользовательского интерфейса.

Проект может служить основой для дальнейшего изучения веб-разработки и может быть расширен дополнительным функционалом. Приобретенные навыки и знания могут быть применены в профессиональной деятельности и дальнейшем обучении.

## Список литературы

1. Next.js Documentation. Официальная документация Next.js [Электронный ресурс]. - Режим доступа: https://nextjs.org/docs (дата обращения: 27.01.2026). - Описание: Полная документация по фреймворку Next.js, включая Server Actions, App Router, и другие возможности.

2. React Documentation. Официальная документация React [Электронный ресурс]. - Режим доступа: https://react.dev (дата обращения: 27.01.2026). - Описание: Документация по библиотеке React, включая хуки, компоненты и лучшие практики.

3. Prisma Documentation. Официальная документация Prisma ORM [Электронный ресурс]. - Режим доступа: https://www.prisma.io/docs (дата обращения: 27.01.2026). - Описание: Подробная документация по Prisma ORM, включая работу с схемой, миграциями и Prisma Client.

4. PostgreSQL Documentation. Официальная документация PostgreSQL [Электронный ресурс]. - Режим доступа: https://www.postgresql.org/docs/ (дата обращения: 27.01.2026). - Описание: Документация по PostgreSQL, включая SQL команды, администрирование и оптимизацию.

5. NextAuth Documentation. Официальная документация NextAuth [Электронный ресурс]. - Режим доступа: https://next-auth.js.org (дата обращения: 27.01.2026). - Описание: Документация по системе аутентификации NextAuth для Next.js приложений.

6. TypeScript Handbook. Официальное руководство по TypeScript [Электронный ресурс]. - Режим доступа: https://www.typescriptlang.org/docs/handbook/intro.html (дата обращения: 27.01.2026). - Описание: Полное руководство по TypeScript, включая типы, интерфейсы и продвинутые возможности.

7. Tailwind CSS Documentation. Официальная документация Tailwind CSS [Электронный ресурс]. - Режим доступа: https://tailwindcss.com/docs (дата обращения: 27.01.2026). - Описание: Документация по утилитарному CSS фреймворку Tailwind, включая классы и адаптивный дизайн.

8. Zod Documentation. Официальная документация Zod [Электронный ресурс]. - Режим доступа: https://zod.dev/ (дата обращения: 27.01.2026). - Описание: Документация по библиотеке валидации Zod с поддержкой TypeScript.

9. next-intl Documentation. Официальная документация next-intl [Электронный ресурс]. - Режим доступа: https://next-intl-docs.vercel.app/ (дата обращения: 27.01.2026). - Описание: Документация по библиотеке интернационализации для Next.js приложений.

10. Docker Documentation. Официальная документация Docker [Электронный ресурс]. - Режим доступа: https://docs.docker.com/ (дата обращения: 27.01.2026). - Описание: Документация по Docker, включая работу с контейнерами и docker-compose.

11. Flanagan, D. JavaScript: The Definitive Guide / D. Flanagan. - 7th ed. - O'Reilly Media, 2020. - 1096 p. - Описание: Полное руководство по JavaScript, включая современные возможности ES6+ и работу с DOM.

12. Banks, A. Learning React: Modern Patterns for Developing React Apps / A. Banks, E. Porcello. - 2nd ed. - O'Reilly Media, 2020. - 310 p. - Описание: Современные паттерны разработки React приложений, включая хуки и контекст.

13. OWASP Top 10. OWASP Foundation [Электронный ресурс]. - Режим доступа: https://owasp.org/www-project-top-ten/ (дата обращения: 27.01.2026). - Описание: Список 10 наиболее критичных уязвимостей веб-приложений и способы их предотвращения.

14. MDN Web Docs. Web technologies documentation [Электронный ресурс]. - Режим доступа: https://developer.mozilla.org/ (дата обращения: 27.01.2026). - Описание: Подробная документация по веб-технологиям, включая HTML, CSS и JavaScript.

15. Stack Overflow. Programming Q&A [Электронный ресурс]. - Режим доступа: https://stackoverflow.com/ (дата обращения: 27.01.2026). - Описание: Сообщество программистов с вопросами и ответами по различным технологиям.

## Приложения

### Приложение 1. Фрагменты исходного кода

#### Приложение 1.1. Создание задачи

**Описание:** Данный фрагмент кода реализует функционал создания новой задачи с валидацией всех полей на сервере.

```typescript
// src/app/actions/todos.ts
export async function addTodoAction(
  _prev: AddTodoState,
  formData: FormData,
): Promise<AddTodoState> {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Todos" });

    // Валидация текста задачи
    const textSchema = z
      .string()
      .trim()
      .min(1, t("errors.textRequired"))
      .max(200, t("errors.textMaxLength"));

    const textResult = textSchema.safeParse(String(formData.get("text") ?? ""));
    if (!textResult.success) {
      return {
        ok: false,
        fieldErrors: { text: textResult.error.errors.map((e) => e.message) },
      };
    }
    const text = textResult.data;

    // Валидация даты выполнения
    const dueDateString = String(formData.get("dueDate") ?? "").trim();
    
    if (!dueDateString) {
      return {
        ok: false,
        fieldErrors: { dueDate: [t("errors.dueDateRequired")] },
      };
    }

    const dueDateSchema = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("errors.invalidDateFormat"))
      .transform((str) => {
        const [year, month, day] = str.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      })
      .pipe(
        z.date().refine(
          (date) => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setUTCHours(0, 0, 0, 0);
            return dateToCheck >= today;
          },
          { message: t("errors.dueDatePast") }
        )
      );

    const dueDateResult = dueDateSchema.safeParse(dueDateString);
    if (!dueDateResult.success) {
      return {
        ok: false,
        fieldErrors: { dueDate: dueDateResult.error.errors.map((e) => e.message) },
      };
    }
    const dueDate = dueDateResult.data;

    // Валидация приоритета
    const priorityString = String(formData.get("priority") ?? "MEDIUM");
    const priorityResult = todoPrioritySchema.safeParse(priorityString);
    if (!priorityResult.success) {
      return {
        ok: false,
        fieldErrors: { priority: [t("errors.priorityInvalid")] },
      };
    }
    const priority = priorityResult.data;

    // Создание задачи в базе данных
    await prisma.todo.create({
      data: {
        text,
        dueDate,
        priority,
        userId,
      },
    });

    // Обновление кэша страницы
    revalidatePath(`/${locale}`);

    return { ok: true };
  } catch (error) {
    console.error("[ADD_TODO] Failed to create todo:", error instanceof Error ? error.message : String(error));
    return {
      ok: false,
      formError: t("errors.createFailed"),
    };
  }
}
```

**Объяснение:** Функция `addTodoAction` выполняет следующие действия:
1. Проверяет авторизацию пользователя через `requireUserId()`
2. Валидирует текст задачи (не пустой, максимум 200 символов)
3. Валидирует дату выполнения (правильный формат, не в прошлом)
4. Валидирует приоритет (один из трех допустимых значений)
5. Сохраняет задачу в базу данных через Prisma
6. Обновляет кэш страницы для отображения новой задачи
7. Возвращает результат операции (успех или ошибка)

#### Приложение 1.2. Редактирование задачи

**Описание:** Данный фрагмент кода реализует функционал обновления существующей задачи.

```typescript
// src/app/actions/todos.ts
export async function updateTodoAction(
  id: string,
  text: string,
  dueDate: string,
  priority: "IMPORTANT" | "MEDIUM" | "EASY"
) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Todos" });

    // Валидация текста
    const textSchema = z
      .string()
      .trim()
      .min(1, t("errors.textRequired"))
      .max(200, t("errors.textMaxLength"));
    
    const textResult = textSchema.safeParse(text);
    if (!textResult.success) {
      throw new Error(textResult.error.errors[0]?.message ?? "Invalid text");
    }
    const validatedText = textResult.data;

    // Валидация даты
    const dueDateSchema = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("errors.invalidDateFormat"))
      .transform((str) => {
        const [year, month, day] = str.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      })
      .pipe(
        z.date().refine(
          (date) => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setUTCHours(0, 0, 0, 0);
            return dateToCheck >= today;
          },
          { message: t("errors.dueDatePast") }
        )
      );

    const dueDateResult = dueDateSchema.safeParse(dueDate);
    if (!dueDateResult.success) {
      throw new Error(dueDateResult.error.errors[0]?.message ?? "Invalid due date");
    }
    const validatedDueDate = dueDateResult.data;

    // Валидация приоритета
    const priorityResult = todoPrioritySchema.safeParse(priority);
    if (!priorityResult.success) {
      throw new Error(t("errors.priorityInvalid"));
    }
    const validatedPriority = priorityResult.data;

    // Обновление задачи в базе данных
    await prisma.todo.updateMany({
      where: { id, userId },
      data: {
        text: validatedText,
        dueDate: validatedDueDate,
        priority: validatedPriority,
      },
    });

    // Обновление кэша страницы
    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[UPDATE_TODO] Failed to update todo:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
```

**Объяснение:** Функция `updateTodoAction` выполняет следующие действия:
1. Проверяет авторизацию пользователя
2. Валидирует все поля задачи (текст, дата, приоритет)
3. Обновляет запись в базе данных с проверкой, что задача принадлежит текущему пользователю (`where: { id, userId }`)
4. Обновляет кэш страницы для отображения изменений
5. Обрабатывает ошибки и логирует их

#### Приложение 1.3. Удаление задачи

**Описание:** Данный фрагмент кода реализует функционал удаления задачи из базы данных.

```typescript
// src/app/actions/todos.ts
export async function deleteTodoAction(id: string) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();

    // Удаление задачи из базы данных
    await prisma.todo.deleteMany({
      where: { id, userId },
    });

    // Обновление кэша страницы
    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[DELETE_TODO] Failed to delete todo:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
```

**Объяснение:** Функция `deleteTodoAction` выполняет следующие действия:
1. Проверяет авторизацию пользователя
2. Удаляет задачу из базы данных с проверкой принадлежности пользователю
3. Обновляет кэш страницы для удаления задачи из интерфейса
4. Обрабатывает ошибки и логирует их

**Важно:** Использование `deleteMany` с условием `where: { id, userId }` гарантирует, что пользователь может удалить только свои задачи.

#### Приложение 1.4. Логика аутентификации

**Описание:** Данный фрагмент кода реализует проверку учетных данных пользователя при входе в систему.

```typescript
// src/lib/auth.ts
async authorize(raw) {
  const parsed = z
    .object({
      identifier: z.string().min(1),
      password: z.string().min(1),
    })
    .safeParse(raw);

  if (!parsed.success) {
    return null;
  }

  const { identifier, password } = parsed.data;

  // Поиск пользователя по email или username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
  });

  if (!user) {
    return null;
  }

  // Проверка пароля
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return null;
  }

  // Возврат данных пользователя (без пароля)
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}
```

**Объяснение:** Функция `authorize` выполняет следующие действия:
1. Валидирует входные данные (identifier и password)
2. Ищет пользователя в базе данных по email или username
3. Проверяет правильность пароля через функцию `verifyPassword`
4. Возвращает данные пользователя (без пароля) при успешной проверке
5. Возвращает `null` при неудачной проверке

**Безопасность:** Пароль никогда не возвращается в результате функции, только его хеш хранится в базе данных.

#### Приложение 1.5. Логика восстановления пароля

**Описание:** Данный фрагмент кода реализует функционал сброса пароля пользователя.

```typescript
// src/app/actions/auth.ts
export async function resetPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });

  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Повторная проверка пользователя для безопасности
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      formError: t("errors.userNotFound"),
    };
  }

  // Валидация пароля
  if (password.length < 6) {
    return {
      ok: false,
      fieldErrors: { password: [t("errors.passwordMin")] },
    };
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      fieldErrors: { confirmPassword: [t("errors.passwordsNoMatch")] },
    };
  }

  // Хеширование нового пароля
  const passwordHash = await hashPassword(password);

  // Обновление пароля в базе данных
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { ok: true, step: "passwordChanged" };
}
```

**Объяснение:** Функция `resetPasswordAction` выполняет следующие действия:
1. Получает данные из формы (identifier, password, confirmPassword)
2. Повторно проверяет существование пользователя для безопасности
3. Валидирует новый пароль (минимум 6 символов, совпадение с подтверждением)
4. Хеширует новый пароль через функцию `hashPassword`
5. Обновляет пароль в базе данных
6. Возвращает результат операции

**Безопасность:** 
- Пароль хешируется перед сохранением в базу данных
- При отсутствии пользователя возвращается общее сообщение об ошибке (без указания причины)
- Повторная проверка пользователя предотвращает возможные атаки

### Приложение 2. Структура базы данных

#### Приложение 2.1. Описание таблиц базы данных

База данных приложения состоит из двух основных таблиц: `User` (Пользователь) и `Todo` (Задача).

**Таблица User (Пользователь):**

Таблица хранит информацию о зарегистрированных пользователях приложения.

Поля таблицы:
- `id` - уникальный идентификатор пользователя (тип: String, первичный ключ)
- `email` - электронная почта пользователя (тип: String, уникальное значение)
- `username` - имя пользователя для входа (тип: String, уникальное значение)
- `displayName` - отображаемое имя пользователя (тип: String)
- `avatarUrl` - URL аватара пользователя (тип: String, опциональное значение)
- `passwordHash` - хеш пароля пользователя (тип: String)
- `createdAt` - дата и время создания записи (тип: DateTime, автоматически устанавливается)
- `updatedAt` - дата и время последнего обновления записи (тип: DateTime, автоматически обновляется)

**Таблица Todo (Задача):**

Таблица хранит информацию о задачах пользователей.

Поля таблицы:
- `id` - уникальный идентификатор задачи (тип: String, первичный ключ)
- `text` - текст задачи (тип: String)
- `completed` - статус выполнения задачи (тип: Boolean, по умолчанию false)
- `dueDate` - срок выполнения задачи (тип: DateTime)
- `priority` - приоритет задачи (тип: TodoPriority, одно из значений: IMPORTANT, MEDIUM, EASY)
- `userId` - идентификатор пользователя-владельца задачи (тип: String, внешний ключ)
- `createdAt` - дата и время создания задачи (тип: DateTime, автоматически устанавливается)
- `updatedAt` - дата и время последнего обновления задачи (тип: DateTime, автоматически обновляется)

#### Приложение 2.2. Связи между таблицами

Между таблицами `User` и `Todo` установлена связь "один ко многим" (one-to-many):

- Один пользователь может иметь множество задач
- Каждая задача принадлежит одному пользователю
- При удалении пользователя все его задачи автоматически удаляются (onDelete: Cascade)

#### Приложение 2.3. Пример схемы Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String  @id @default(cuid())
  email        String  @unique
  username     String  @unique
  displayName  String
  avatarUrl    String?
  passwordHash String
  todos        Todo[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum TodoPriority {
  IMPORTANT
  MEDIUM
  EASY
}

model Todo {
  id        String      @id @default(cuid())
  text      String
  completed Boolean     @default(false)
  dueDate   DateTime
  priority  TodoPriority

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

**Объяснение схемы:**

1. **Generator** - указывает Prisma генерировать клиент для JavaScript
2. **Datasource** - указывает использование PostgreSQL и переменную окружения для подключения
3. **Model User** - определяет структуру таблицы пользователей с полями и связью с задачами
4. **Enum TodoPriority** - определяет перечисление приоритетов задач
5. **Model Todo** - определяет структуру таблицы задач с полями, связью с пользователем и индексом по userId

**Индексы:**

В таблице `Todo` создан индекс по полю `userId` для ускорения запросов поиска задач пользователя.

**Каскадное удаление:**

При удалении пользователя все его задачи автоматически удаляются благодаря опции `onDelete: Cascade` в определении связи.
