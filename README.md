# @hocky/easy-router

Tiny React hooks for [OpenRouter](https://openrouter.ai) — persistent API key & model selection with zero boilerplate.

## Install

```bash
npm install @hocky/easy-router @openrouter/ai-sdk-provider ai
```

`react >=19` and `ai >=6` are peer dependencies.

## Hooks

### `useOpenRouter`

Manages an OpenRouter provider whose API key and model are automatically persisted to `localStorage`.

```tsx
import { useOpenRouter } from "@hocky/easy-router";
import { generateText } from "ai";

function Chat() {
  const { model, setModel, apiKey, setApiKey, getModel } = useOpenRouter();

  async function send(prompt: string) {
    const { text } = await generateText({ model: getModel(), prompt });
    console.log(text);
  }

  return (
    <div>
      <input
        placeholder="OpenRouter API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <input
        placeholder="Model"
        value={model}
        onChange={(e) => setModel(e.target.value)}
      />
      <button onClick={() => send("Hello!")}>Send</button>
    </div>
  );
}
```

#### Options

```ts
const { apiKey, setApiKey, model, setModel, provider, getModel } =
  useOpenRouter({
    defaultModel: "openai/gpt-4o",   // initial model id
    defaultApiKey: "",                // initial API key
    prefix: "easy-router",           // localStorage key prefix
    providerSettings: { /* ... */ },  // extra OpenRouterProviderSettings
  });
```

| Return        | Description                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------- |
| `apiKey`      | Current API key                                                                               |
| `setApiKey`   | Update persisted API key                                                                      |
| `model`       | Current model id                                                                              |
| `setModel`    | Update persisted model id                                                                     |
| `provider`    | `OpenRouterProvider` instance — pass models from it to any AI SDK function                    |
| `getModel()`  | Shorthand: returns a chat model using the stored model id (or pass a model id to override)    |

### `useStore`

General-purpose hook that persists any JSON-serializable value to `localStorage` with cross-tab sync.

```tsx
import { useStore } from "@hocky/easy-router";

const [theme, setTheme] = useStore("theme", "dark");
```

- Follows the same `[value, setValue]` API as `useState`.
- `setValue` also accepts an updater function: `setTheme(prev => prev === "dark" ? "light" : "dark")`.
- All components sharing the same key stay in sync automatically.
- Works across browser tabs via the `storage` event.

## License

ISC
"# easy-router" 
