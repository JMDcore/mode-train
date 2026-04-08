"use client";

import { Target, TrendingUp, UserRound } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { completeOnboardingAction } from "@/server/profile/actions";
import type { UserProfile } from "@/server/profile";
import type { ProfileActionState } from "@/server/profile/types";

const initialState: ProfileActionState = {
  error: null,
};

const goalOptions = [
  "Ganar musculo",
  "Perder grasa",
  "Ser mas fuerte",
  "Fitness hibrido",
  "Crear constancia",
];

const levelOptions = ["Principiante", "Intermedio", "Avanzado"];

export function OnboardingCard(props: { profile: UserProfile }) {
  const [state, formAction] = useActionState(completeOnboardingAction, initialState);

  return (
    <div className="auth-card">
      <div className="auth-card__brand">
        <div className="auth-card__mark">MT</div>
        <div>
          <p className="auth-card__eyebrow">Perfil inicial</p>
          <h1 className="auth-card__title">Ajusta tu base</h1>
        </div>
      </div>

      <p className="auth-card__subtitle">
        Necesitamos muy poco para personalizar tu experiencia y empezar a darte una
        app realmente tuya.
      </p>

      <form action={formAction} className="auth-form">
        <Field
          icon={UserRound}
          label="Nombre"
          name="displayName"
          placeholder="Jose Miguel"
          defaultValue={props.profile.displayName}
        />

        <SelectField
          icon={Target}
          label="Objetivo"
          name="goal"
          options={goalOptions}
          defaultValue={props.profile.goal}
        />

        <SelectField
          icon={TrendingUp}
          label="Nivel"
          name="experienceLevel"
          options={levelOptions}
          defaultValue={props.profile.experienceLevel}
        />

        <div className="auth-grid">
          <NumberField
            label="Sesiones / semana"
            name="preferredWeeklySessions"
            placeholder="4"
            defaultValue={props.profile.preferredWeeklySessions ?? ""}
          />
          <NumberField
            label="Altura (cm)"
            name="heightCm"
            placeholder="178"
            defaultValue={props.profile.heightCm ?? ""}
          />
        </div>

        <NumberField
          label="Peso (kg)"
          name="weightKg"
          placeholder="77.4"
          defaultValue={props.profile.weightKg ?? ""}
          step="0.1"
        />

        {state.error ? <p className="auth-error">{state.error}</p> : null}

        <SubmitButton />
      </form>
    </div>
  );
}

function Field(props: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
}) {
  const Icon = props.icon;

  return (
    <label className="auth-field">
      <span className="auth-field__label">{props.label}</span>
      <span className="auth-field__control">
        <span className="auth-field__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <input
          type="text"
          name={props.name}
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
          required
        />
      </span>
    </label>
  );
}

function SelectField(props: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  const Icon = props.icon;

  return (
    <label className="auth-field">
      <span className="auth-field__label">{props.label}</span>
      <span className="auth-field__control">
        <span className="auth-field__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <select name={props.name} defaultValue={props.defaultValue || ""} required>
          <option value="" disabled>
            Selecciona una opcion
          </option>
          {props.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function NumberField(props: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string | number;
  step?: string;
}) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">{props.label}</span>
      <span className="auth-field__control">
        <input
          type="number"
          name={props.name}
          placeholder={props.placeholder}
          defaultValue={props.defaultValue}
          min="0"
          step={props.step}
          required={props.name === "preferredWeeklySessions"}
        />
      </span>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="auth-submit" disabled={pending}>
      {pending ? "Guardando..." : "Entrar en la app"}
    </button>
  );
}
