"use client";

import { Activity, CalendarDays, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthActionState } from "@/server/auth/actions";

const initialState: AuthActionState = {
  error: null,
};

type AuthFormAction = (
  previousState: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

type AuthCardProps = {
  action: AuthFormAction;
  mode: "login" | "register";
  title: string;
  subtitle: string;
  eyebrow?: string;
};

export function AuthCard(props: AuthCardProps) {
  const [state, formAction] = useActionState(props.action, initialState);
  const isRegister = props.mode === "register";
  const highlights = isRegister
    ? ["Privada", "Lista en minutos"]
    : ["Tu espacio", "Lista para entrenar"];
  const stats = isRegister
    ? [
        { icon: ShieldCheck, label: "Base", value: "Privada" },
        { icon: CalendarDays, label: "Agenda", value: "Clara" },
      ]
    : [
        { icon: Activity, label: "Resumen", value: "Vivo" },
        { icon: CalendarDays, label: "Agenda", value: "Hoy" },
      ];

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
          <span className="auth-card__capsule">{props.eyebrow ?? "Mode Train"}</span>
        </div>

        <div className="auth-card__showcase">
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
            <p className="auth-card__mode">{isRegister ? "Acceso privado" : "Modo listo"}</p>
            <h1 className="auth-card__title">{props.title}</h1>
            <p className="auth-card__subtitle">{props.subtitle}</p>
          </div>

          <div className="auth-card__chips">
            {highlights.map((item) => (
              <span key={item} className="auth-chip">
                {item}
              </span>
            ))}
          </div>

          <div className="auth-card__stats">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="auth-card__stat">
                  <span className="auth-card__stat-icon">
                    <Icon size={15} strokeWidth={2.2} />
                  </span>
                  <div>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <form action={formAction} className="auth-form auth-form--card">
        {isRegister ? (
          <Field icon={UserRound} label="Nombre" name="displayName" placeholder="Jose Miguel" />
        ) : null}

        <Field icon={Mail} label="Email" name="email" placeholder="jmdcore.dev@gmail.com" type="email" />
        <Field icon={LockKeyhole} label="Contrasena" name="password" placeholder="********" type="password" />

        {state.error ? <p className="auth-error">{state.error}</p> : null}

        <SubmitButton label={isRegister ? "Crear cuenta" : "Entrar"} />
      </form>

      <p className="auth-switch">
        {isRegister ? "¿Ya tienes cuenta?" : "¿Aun no tienes cuenta?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Entrar" : "Crear una"}
        </Link>
      </p>
    </div>
  );
}

function Field(props: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  name: string;
  placeholder: string;
  type?: string;
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
          type={props.type ?? "text"}
          name={props.name}
          placeholder={props.placeholder}
          autoComplete={props.type === "password" ? "current-password" : props.name}
          required
        />
      </span>
    </label>
  );
}

function SubmitButton(props: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="auth-submit" disabled={pending}>
      {pending ? "Procesando..." : props.label}
    </button>
  );
}
