"use client";

import { LockKeyhole, Mail, UserRound } from "lucide-react";
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

  return (
    <div className="auth-card">
      <div className="auth-card__hero">
        <div className="auth-card__brand">
          <div className="auth-card__mark">MT</div>
          <div>
            <p className="auth-card__eyebrow">{props.eyebrow ?? "Mode Train"}</p>
            <h1 className="auth-card__title">{props.title}</h1>
          </div>
        </div>

        <p className="auth-card__subtitle">{props.subtitle}</p>

        <div className="auth-card__chips">
          {highlights.map((item) => (
            <span key={item} className="auth-chip">
              {item}
            </span>
          ))}
        </div>
      </div>

      <form action={formAction} className="auth-form">
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
