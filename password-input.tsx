'use client';
import {useState,type InputHTMLAttributes} from 'react';
import {Eye,EyeOff} from 'lucide-react';
export default function PasswordInput(props:InputHTMLAttributes<HTMLInputElement>){const [visible,setVisible]=useState(false);return <div className="password-input"><input {...props} type={visible?'text':'password'}/><button type="button" aria-label={(visible?'Hide ':'Show ')+(props['aria-label']||props.name||'password')} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>}
