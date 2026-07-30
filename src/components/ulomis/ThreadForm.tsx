import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Field, UCheckbox, UInput, USelect, UTextarea } from "./Form";
import { UButton } from "./Button";
import { UCard } from "./Card";
import { UlomisMark, type UlomisState } from "./UlomisMark";

const kinds = ["A plan", "A project", "A conversation", "A responsibility"];

export function ThreadForm() {
  const [state, setState] = useState<UlomisState>("idle");
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("confirmed");
    toast.success("Thread kept", {
      description: title
        ? `Ulomis is holding “${title}” until you come back to it.`
        : "Ulomis is holding this until you come back to it.",
    });
  }

  return (
    <UCard variant="raised" padding="lg">
      <div className="mb-6 flex items-center gap-4">
        <UlomisMark size={44} state={state} eyes={state === "confirmed"} />
        <div>
          <h3 className="text-lg font-semibold">Leave a thread for later</h3>
          <p className="text-sm text-muted-foreground">
            Write what you'd otherwise have to reconstruct from memory.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} onChange={() => setState("attentive")}>
        <Field label="What is this" htmlFor="thread-title">
          <UInput
            id="thread-title"
            required
            placeholder="Moving flat"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Kind of thread" htmlFor="thread-kind">
          <USelect id="thread-kind" defaultValue={kinds[0]}>
            {kinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </USelect>
        </Field>

        <Field
          label="Where you're stopping"
          htmlFor="thread-state"
          hint="The half-finished sentence counts. So does the thing you decided against."
        >
          <UTextarea
            id="thread-state"
            required
            placeholder="Van still unbooked — was comparing two options. Date already changed once."
          />
        </Field>

        <UCheckbox
          label="Show me the corrections I made when I come back"
          defaultChecked
          name="show-corrections"
        />

        <div className="flex flex-wrap gap-3 pt-1">
          <UButton type="submit" variant="thread" size="lg">
            Keep the thread
          </UButton>
          <UButton
            type="reset"
            variant="ghost"
            size="lg"
            onClick={() => {
              setTitle("");
              setState("idle");
            }}
          >
            Clear
          </UButton>
        </div>
      </form>
    </UCard>
  );
}
