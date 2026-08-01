/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppUser, UserInvitation } from '../types';
import {
  Lock,
  Mail,
  User,
  Key,
  HelpCircle,
  Plane,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  users: AppUser[];
  invitations: UserInvitation[];
  onLogin: (user: AppUser) => void;
  onRegisterFromInvitation: (newUser: AppUser, inviteCode: string) => void;
  onUpdateUsers: (updatedUsers: AppUser[]) => void;
  appTitle: string;
  appSubtitle: string;
  logoBase64: string | null;
}

type AuthMode = 'login' | 'register' | 'recovery';

export default function AuthScreen({
  users,
  invitations,
  onLogin,
  onRegisterFromInvitation,
  onUpdateUsers,
  appTitle,
  appSubtitle,
  logoBase64
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login states
  const [loginIdentifier, setLoginIdentifier] = useState(''); // email or username
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register states
  const [invitationCodeInput, setInvitationCodeInput] = useState('');
  const [matchedInvitation, setMatchedInvitation] = useState<UserInvitation | null>(null);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerQuestion, setRegisterQuestion] = useState('¿Cuál es tu avión favorito?');
  const [registerAnswer, setRegisterAnswer] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Recovery states
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [foundUser, setFoundUser] = useState<AppUser | null>(null);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // Pre-defined security questions
  const securityQuestions = [
    '¿Cuál es tu avión favorito?',
    '¿Cuál fue el nombre de tu primera aerolínea?',
    '¿Nombre de tu primer destino de viaje?',
    '¿Marca del primer modelo a escala que tuviste?',
    '¿Tu clave favorita de aeropuerto (IATA/ICAO)?'
  ];

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier || !loginPassword) {
      setLoginError('Por favor complete todos los campos.');
      return;
    }

    const matchedUser = users.find(
      (u) =>
        (u.username?.toLowerCase() === loginIdentifier.toLowerCase() ||
          u.email.toLowerCase() === loginIdentifier.toLowerCase()) &&
        (u.password === loginPassword || (!u.password && loginPassword === 'password123')) // fallback if not set
    );

    if (matchedUser) {
      if (matchedUser.status === 'inactive') {
        setLoginError('Tu cuenta se encuentra inactiva. Por favor contacta al administrador para la activación.');
        return;
      }
      onLogin(matchedUser);
    } else {
      setLoginError('Nombre de usuario/correo o contraseña incorrectos.');
    }
  };

  // Check Invitation Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setMatchedInvitation(null);

    const code = invitationCodeInput.trim().toUpperCase();
    const invite = invitations.find(
      (inv) => inv.code.toUpperCase() === code && inv.status === 'pending'
    );

    if (invite) {
      setMatchedInvitation(invite);
      setRegisterName('');
      setRegisterUsername(invite.email.split('@')[0]); // suggestion
    } else {
      setRegisterError('El código de invitación no existe o ya ha sido utilizado.');
    }
  };

  // Handle Invitation Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!matchedInvitation) return;

    if (!registerUsername || !registerName || !registerPassword || !registerConfirmPassword || !registerAnswer) {
      setRegisterError('Por favor complete todos los campos requeridos.');
      return;
    }

    // Check username length
    if (registerUsername.length < 3) {
      setRegisterError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }

    // Check password length
    if (registerPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Check password matches
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }

    // Check duplicate username or email
    const usernameExists = users.some(
      (u) => u.username?.toLowerCase() === registerUsername.toLowerCase()
    );
    if (usernameExists) {
      setRegisterError('Este nombre de usuario ya está registrado por otro colaborador.');
      return;
    }

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === matchedInvitation.email.toLowerCase()
    );
    if (emailExists) {
      setRegisterError('Esta dirección de correo ya está asociada a otra cuenta activa.');
      return;
    }

    // Create the new user object
    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      name: registerName,
      email: matchedInvitation.email,
      role: matchedInvitation.role,
      canPublish: matchedInvitation.canPublish,
      username: registerUsername,
      password: registerPassword,
      securityQuestion: registerQuestion,
      securityAnswer: registerAnswer.trim(),
      status: 'active',
      activatedAt: new Date().toISOString()
    };

    onRegisterFromInvitation(newUser, matchedInvitation.code);
    setRegisterSuccess('¡Registro completado con éxito! Iniciando sesión...');
    
    setTimeout(() => {
      onLogin(newUser);
    }, 1500);
  };

  // Recovery Step 1: Find User
  const handleRecoveryStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryIdentifier) {
      setRecoveryError('Por favor, ingresa tu usuario o correo electrónico.');
      return;
    }

    const user = users.find(
      (u) =>
        u.username?.toLowerCase() === recoveryIdentifier.toLowerCase() ||
        u.email.toLowerCase() === recoveryIdentifier.toLowerCase()
    );

    if (user) {
      setFoundUser(user);
      if (user.securityQuestion) {
        setRecoveryStep(2);
      } else {
        // Fallback for mock users who don't have security question set
        // Set a default question for them for testing
        const tempUser = {
          ...user,
          securityQuestion: '¿Cuál es tu avión favorito?',
          securityAnswer: user.role === 'admin' ? 'boeing 787' : user.role === 'editor' ? 'airbus a350' : 'cessna 172'
        };
        setFoundUser(tempUser);
        setRecoveryStep(2);
      }
    } else {
      setRecoveryError('No se encontró ningún usuario con ese nombre o correo.');
    }
  };

  // Recovery Step 2: Answer Question
  const handleRecoveryStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryAnswerInput) {
      setRecoveryError('Por favor, ingresa tu respuesta.');
      return;
    }

    if (!foundUser) return;

    const answer = foundUser.securityAnswer || '';
    const isAnswerCorrect = answer.toLowerCase().trim() === recoveryAnswerInput.toLowerCase().trim();

    if (isAnswerCorrect) {
      setRecoveryStep(3);
    } else {
      setRecoveryError('La respuesta secreta no es correcta. Inténtalo de nuevo.');
    }
  };

  // Recovery Step 3: Change Password
  const handleRecoveryStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!newPassword || !confirmNewPassword) {
      setRecoveryError('Por favor complete las contraseñas.');
      return;
    }

    if (newPassword.length < 6) {
      setRecoveryError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Las contraseñas no coinciden.');
      return;
    }

    if (!foundUser) return;

    // Update the password in users list
    const updatedUsers = users.map((u) => {
      if (u.id === foundUser.id) {
        return {
          ...u,
          password: newPassword,
          // Guardamos también la pregunta para asegurar que se guarde la semilla por si acaso
          securityQuestion: foundUser.securityQuestion,
          securityAnswer: foundUser.securityAnswer
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setRecoverySuccess('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.');
    
    setTimeout(() => {
      setMode('login');
      setRecoveryStep(1);
      setLoginIdentifier(foundUser.username || foundUser.email);
      setLoginPassword('');
      setFoundUser(null);
      setRecoveryAnswerInput('');
      setNewPassword('');
      setConfirmNewPassword('');
      setRecoverySuccess('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col items-center justify-center relative p-4 overflow-hidden select-none">
      
      {/* Airport Watermark Background specifically for Auth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none flex items-center justify-center">
        <svg
          className="w-[120vw] h-[120vw] max-w-[1200px] text-idac-blue/[0.02] transform translate-y-[-5%]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          aria-hidden="true"
        >
          {/* Concentric radar range rings */}
          <circle cx="75" cy="30" r="10" strokeDasharray="1,2" />
          <circle cx="75" cy="30" r="20" strokeDasharray="1,3" />
          <circle cx="75" cy="30" r="30" strokeDasharray="1,4" />
          
          {/* Runway and landing guidance lines */}
          <path d="M10,95 L40,65 L43,65 L15,95 Z" fill="currentColor" fillOpacity="0.08" />
          <line x1="12.5" y1="95" x2="41.5" y2="65" strokeDasharray="2,2" />
          <line x1="10" y1="95" x2="40" y2="65" />
          <line x1="15" y1="95" x2="43" y2="65" />
          
          {/* Taxiway / Runway markings */}
          <path d="M5,80 L25,80" />
          <path d="M25,80 L35,68" strokeDasharray="1,1" />

          {/* Control Tower */}
          <path d="M70,75 L73,50 L77,50 L80,75 Z" />
          <line x1="75" y1="75" x2="75" y2="50" />
          <line x1="73" y1="62" x2="77" y2="62" />
          <path d="M71,50 L69,42 L81,42 L79,50 Z" fill="currentColor" fillOpacity="0.15" />
          <line x1="73" y1="42" x2="74" y2="50" />
          <line x1="77" y1="42" x2="76" y2="50" />
          <line x1="70" y1="42" x2="72" y2="50" />
          <line x1="80" y1="42" x2="78" y2="50" />
          <path d="M69,42 L75,38 L81,42 Z" />
          <line x1="75" y1="38" x2="75" y2="34" />
          <path d="M71,34 C71,34 73,32 75,32 C77,32 79,34 79,34" />
          
          {/* Terminal Building */}
          <path d="M42,75 L42,65 L65,65 L65,75 Z" fill="currentColor" fillOpacity="0.08" />
          <rect x="44" y="67" width="4" height="4" />
          <rect x="50" y="67" width="4" height="4" />
          <rect x="56" y="67" width="4" height="4" />
          {/* Ground line */}
          <line x1="5" y1="75" x2="95" y2="75" strokeWidth="1" />

          {/* Airplane taking off */}
          <g transform="translate(42, 35) rotate(-20) scale(0.6)">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" fill="currentColor" />
          </g>
        </svg>
        <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full border border-idac-blue/[0.02]" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full border border-idac-blue/[0.02]" />
      </div>

      <div className="w-full max-w-md z-10">
        
        {/* Logo and header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border border-slate-100 shadow-xl p-3 overflow-hidden mb-4 hover:scale-105 transition-transform">
            {logoBase64 ? (
              <img src={logoBase64} alt="Custom Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#00316f] to-[#001f44] rounded-2xl flex items-center justify-center text-white">
                <Plane className="w-8 h-8 rotate-[-45deg]" />
              </div>
            )}
          </div>
          <h1 className="text-lg font-black tracking-wider uppercase text-idac-blue">{appTitle}</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 max-w-xs leading-relaxed">
            {appSubtitle}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Tabs for Login / Register */}
          {mode !== 'recovery' && (
            <div className="flex bg-slate-50 rounded-2xl p-1 mb-6 border border-slate-100">
              <button
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2.5 text-center text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#00316f] text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                Ingresar
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setRegisterError('');
                  setMatchedInvitation(null);
                }}
                className={`flex-1 py-2.5 text-center text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#00316f] text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                Registro Invitado
              </button>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Usuario o Correo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="luism o juan@idac.gob.do"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery');
                      setRecoveryStep(1);
                      setRecoveryError('');
                      setRecoverySuccess('');
                    }}
                    className="text-[10px] font-black text-idac-blue hover:underline uppercase tracking-widest"
                  >
                    ¿Olvidaste la clave?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-idac-blue text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-idac-dark transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Acceder al Archivo</span>
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                  Acceso de prueba: <span className="text-slate-600 font-extrabold font-mono">luism</span> / <span className="text-slate-600 font-extrabold font-mono">password123</span>
                </span>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER WITH INVITATION */}
          {mode === 'register' && (
            <div className="space-y-4">
              {!matchedInvitation ? (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="p-4 bg-blue-50/20 border border-idac-blue/10 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed text-center">
                      Si fuiste invitado por un administrador del IDAC, ingresa tu código de acceso para configurar tus credenciales.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Código de Invitación
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ej. IDAC-77X9"
                        value={invitationCodeInput}
                        onChange={(e) => setInvitationCodeInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-mono font-bold uppercase placeholder:font-sans placeholder:normal-case text-slate-700"
                      />
                    </div>
                  </div>

                  {registerError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-idac-blue text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-idac-dark transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Verificar Código</span>
                  </button>

                  <div className="pt-2 border-t border-slate-100 text-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                      Código de prueba: <span className="text-slate-600 font-extrabold font-mono">IDAC-77X9</span> (colaborador.nuevo@idac.gob.do)
                    </span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Código Validado</span>
                      <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-wider block">Correo: {matchedInvitation.email}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Nombre de Usuario
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ej. juanperez"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <ClipboardList className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          placeholder="Mín. 6 caracteres"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Confirmar
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                      Pregunta de Seguridad (Para Recuperar Cuenta)
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <select
                        value={registerQuestion}
                        onChange={(e) => setRegisterQuestion(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue font-bold uppercase tracking-wider text-slate-600"
                      >
                        {securityQuestions.map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="relative">
                        <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Tu respuesta secreta"
                          value={registerAnswer}
                          onChange={(e) => setRegisterAnswer(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {registerError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{registerSuccess}</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setMatchedInvitation(null)}
                      className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Atrás
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Crear Mi Cuenta
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 3: ACCOUNT RECOVERY */}
          {mode === 'recovery' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRecoveryStep(1);
                    setRecoveryError('');
                    setRecoverySuccess('');
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-all cursor-pointer"
                  title="Volver al acceso"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs font-black uppercase tracking-widest text-idac-blue">
                  Recuperación de Cuenta
                </h3>
              </div>

              {recoveryStep === 1 && (
                <form onSubmit={handleRecoveryStep1} className="space-y-4">
                  <div className="p-3.5 bg-blue-50/20 border border-idac-blue/10 rounded-2xl">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed text-center">
                      Ingresa tu usuario o correo electrónico registrado. Verificaremos tu perfil y te solicitaremos la respuesta de seguridad.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Nombre de Usuario o Correo
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ej. luism o juan@idac.gob.do"
                        value={recoveryIdentifier}
                        onChange={(e) => setRecoveryIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-idac-blue text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-idac-dark transition-all cursor-pointer shadow-md"
                  >
                    Buscar Cuenta
                  </button>
                </form>
              )}

              {recoveryStep === 2 && foundUser && (
                <form onSubmit={handleRecoveryStep2} className="space-y-4">
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-0.5">Identidad Confirmada</span>
                    <span className="text-[11px] font-bold text-slate-700 block">{foundUser.name} ({foundUser.email})</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Pregunta de Seguridad
                    </label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700">
                      {foundUser.securityQuestion || '¿Cuál es tu avión favorito?'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Respuesta Secreta
                    </label>
                    <div className="relative">
                      <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ingresa la respuesta configurada"
                        value={recoveryAnswerInput}
                        onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-idac-blue text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-idac-dark transition-all cursor-pointer shadow-md"
                  >
                    Validar Respuesta
                  </button>

                  <div className="pt-2 text-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-relaxed block">
                      Nota de desarrollo: Para la cuenta de semilla seleccionada, la respuesta secreta es: <span className="text-slate-600 font-extrabold font-mono">{foundUser.role === 'admin' ? 'Boeing 787' : foundUser.role === 'editor' ? 'Airbus A350' : 'Cessna 172'}</span>
                    </span>
                  </div>
                </form>
              )}

              {recoveryStep === 3 && foundUser && (
                <form onSubmit={handleRecoveryStep3} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider text-center">
                      ¡Respuesta correcta! Por favor ingresa tu nueva contraseña de acceso.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Repita la nueva contraseña"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-idac-blue focus:ring-2 focus:ring-idac-blue/10 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  {recoverySuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{recoverySuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Restablecer Contraseña
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
