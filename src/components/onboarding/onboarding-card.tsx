"use client";

import { Activity, CalendarDays, Target, TrendingUp, UserRound } from "lucide-react";
import Image from "next/image";
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
      <span className="auth-card__glow auth-card__glow--violet" aria-hidden="true" />
      <span className="auth-card__glow auth-card__glow--lime" aria-hidden="true" />

      <div className="auth-card__hero">
        <div className="auth-card__topline">
          <div className="auth-card__brand">
            <div className="auth-card__mark">MT</div>
            <p className="auth-card__eyebrow">Mode Train</p>
          </div>
          <span className="auth-card__capsule">Perfil inicial</span>
        </div>

        <div className="auth-card__showcase auth-card__showcase--setup">
          <div className="auth-card__art" aria-hidden="true">
            <Image
              src="/media/anatomy-mannequin.svg"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 28rem"
              className="auth-card__art-image"
            />
          </div>
          <div className="auth-card__showcase-veil" aria-hidden="true" />

          <div className="auth-card__copy">
            <p className="auth-card__mode">Base personal</p>
            <h1 className="auth-card__title">Ajusta tu perfil</h1>
            <p className="auth-card__subtitle">
              Muy pocos datos, mucha mas precision. Con esto dejamos lista tu agenda,
              tus plantillas y el resumen real de progreso.
            </p>
          </div>

          <div className="auth-card__chips">
            <span className="auth-chip">Rutinas</span>
            <span className="auth-chip">Agenda</span>
            <span className="auth-chip">Resumen</span>
          </div>

          <div className="auth-card__stats">
            <div className="auth-card__stat">
              <span className="auth-card__stat-icon">
                <Target size={15} strokeWidth={2.2} />
              </span>
              <div>
                <small>Objetivo</small>
                <strong>{props.profile.goal || "Base"}</strong>
              </div>
            </div>

            <div className="auth-card__stat">
              <span className="auth-card__stat-icon">
                <CalendarDays size={15} strokeWidth={2.2} />
              </span>
              <div>
                <small>Sesiones</small>
                <strong>{props.profile.preferredWeeklySessions ?? "4"} / semana</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form action={formAction} className="auth-form auth-form--card auth-form--setup">
        <div className="auth-section">
          <div className="auth-section__head">
            <p className="auth-section__kicker">Identidad</p>
            <h2 className="auth-section__title">Tu base personal</h2>
          </div>

          <Field
            icon={UserRound}
            label="Nombre"
            name="displayName"
            placeholder="Jose Miguel"
            defaultValue={props.profile.displayName}
          />
        </div>

        <div className="auth-section">
          <div className="auth-section__head">
            <p className="auth-section__kicker">Entreno</p>
            <h2 className="auth-section__title">Lo que quieres mejorar</h2>
          </div>

          <ChoiceField
            label="Objetivo"
            name="goal"
            options={goalOptions}
            defaultValue={props.profile.goal}
          />

          <ChoiceField
            label="Nivel"
            name="experienceLevel"
            options={levelOptions}
            defaultValue={props.profile.experienceLevel}
          />

          <NumberField
            label="Sesiones / semana"
            name="preferredWeeklySessions"
            placeholder="4"
            defaultValue={props.profile.preferredWeeklySessions ?? ""}
          />
        </div>

        <div className="auth-section">
          <div className="auth-section__head">
            <p className="auth-section__kicker">Fisico</p>
            <h2 className="auth-section__title">Punto de partida</h2>
          </div>

          <div className="auth-grid">
            <NumberField
              label="Altura (cm)"
              name="heightCm"
              placeholder="178"
              defaultValue={props.profile.heightCm ?? ""}
            />
            <NumberField
              label="Peso (kg)"
              name="weightKg"
              placeholder="77.4"
              defaultValue={props.profile.weightKg ?? ""}
              step="0.1"
            />
          </div>
        </div>

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

function ChoiceField(props: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  compact?: boolean;
}) {
  return (
    <fieldset className="auth-choice-group">
      <legend className="auth-field__label">{props.label}</legend>
      <div
        className={`auth-choice-group__grid${props.compact ? " auth-choice-group__grid--compact" : ""}`}
      >
        {props.options.map((option, index) => {
          const id = `${props.name}-${index}`;

          return (
            <label key={option} htmlFor={id} className="auth-choice-pill">
              <input
                id={id}
                type="radio"
                name={props.name}
                value={option}
                defaultChecked={(props.defaultValue || "") === option}
                required
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function NumberField(props: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string | number;
  step?: string;
}) {
  const Icon = props.name === "preferredWeeklySessions" ? Activity : TrendingUp;

  return (
    <label className="auth-field">
      <span className="auth-field__label">{props.label}</span>
      <span className="auth-field__control">
        <span className="auth-field__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
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
      {pending ? "Guardando..." : "Entrar en Mode Train"}
    </button>
  );
}
