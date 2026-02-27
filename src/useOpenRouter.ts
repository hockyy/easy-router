import { useCallback, useMemo, useRef } from "react";
import {
  createOpenRouter,
  type OpenRouterProvider,
  type OpenRouterProviderSettings,
  type OpenRouterChatSettings,
} from "@openrouter/ai-sdk-provider";
import { useStore } from "./useStore";

const DEFAULT_MODEL = "openai/gpt-4o";

export type { OpenRouterProvider, OpenRouterProviderSettings, OpenRouterChatSettings };

export interface UseOpenRouterOptions {
  /** Default model id (e.g. "openai/gpt-4o"). Overridden once the user calls `setModel`. */
  defaultModel?: string;
  /** Default API key. Overridden once the user calls `setApiKey`. */
  defaultApiKey?: string;
  /** Extra settings forwarded to `createOpenRouter` (headers, baseURL, etc.). */
  providerSettings?: Omit<OpenRouterProviderSettings, "apiKey">;
  /** localStorage key prefix. Defaults to `"easy-router"`. */
  prefix?: string;
}

export interface UseOpenRouterReturn {
  /** Current API key (persisted in localStorage). */
  apiKey: string;
  /** Update the persisted API key. */
  setApiKey: (key: string | ((prev: string) => string)) => void;
  /** Current model id (persisted in localStorage). */
  model: string;
  /** Update the persisted model id. */
  setModel: (model: string | ((prev: string) => string)) => void;
  /**
   * A ready-to-use OpenRouter provider created with the current API key.
   * Use it to build model instances for any AI SDK function:
   *
   * ```ts
   * const { text } = await generateText({
   *   model: provider("anthropic/claude-3.5-sonnet"),
   *   prompt: "Hi!",
   * });
   * ```
   */
  provider: OpenRouterProvider;
  /**
   * Shorthand that returns a language model using the currently stored model id.
   * Optionally pass a `modelId` to override.
   *
   * ```ts
   * const { text } = await generateText({ model: getModel(), prompt: "Hi!" });
   * ```
   */
  getModel: (
    modelId?: string,
    settings?: OpenRouterChatSettings,
  ) => ReturnType<OpenRouterProvider["chat"]>;
}

/**
 * React hook that manages an OpenRouter provider with persistent API key and
 * model selection backed by `localStorage` (via `useStore`).
 *
 * ```tsx
 * const { model, setModel, apiKey, setApiKey, provider, getModel } = useOpenRouter();
 *
 * // Later in an event handler:
 * const { text } = await generateText({ model: getModel(), prompt: "Hello!" });
 * ```
 */
export function useOpenRouter(
  options: UseOpenRouterOptions = {},
): UseOpenRouterReturn {
  const {
    defaultModel = DEFAULT_MODEL,
    defaultApiKey = "",
    providerSettings,
    prefix = "easy-router",
  } = options;

  const [apiKey, setApiKey] = useStore<string>(`${prefix}:api-key`, defaultApiKey);
  const [model, setModel] = useStore<string>(`${prefix}:model`, defaultModel);

  // Stabilize providerSettings so inline objects don't recreate the provider
  const settingsRef = useRef(providerSettings);
  settingsRef.current = providerSettings;

  const provider = useMemo<OpenRouterProvider>(
    () => createOpenRouter({ ...settingsRef.current, apiKey: apiKey || undefined }),
    [apiKey],
  );

  const getModel = useCallback(
    (modelId?: string, settings?: OpenRouterChatSettings) =>
      provider.chat(modelId ?? model, settings),
    [provider, model],
  );

  return { apiKey, setApiKey, model, setModel, provider, getModel };
}
