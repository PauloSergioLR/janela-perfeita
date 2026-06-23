export type ResultState = "content" | "empty" | "error" | "initial" | "loading";

interface ResultStateInput {
  hasContent: boolean;
  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
}

export function getResultState({
  hasContent,
  isError,
  isIdle,
  isPending,
}: ResultStateInput): ResultState {
  if (isPending) {
    return "loading";
  }

  if (isError) {
    return "error";
  }

  if (hasContent) {
    return "content";
  }

  return isIdle ? "initial" : "empty";
}
