import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function readFileAsDataUrl(file){
  return new Promise((resolve)=>{
    const reader = new FileReader()
    reader.onloadend = ()=>{
      if(typeof reader.result === 'string'){
        resolve(reader.result)
      }
    }
    reader.readAsDataURL(file)
  })
}

export function formatDate(inputDate){
  const date = new Date(inputDate)

  const day = date.getDate().toString().padStart(2,'0')
  const month = (date.getMonth()+1).toString().padStart(2,'0')
  const year = date.getFullYear().toString()

  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2,'0')
  const isPM = hours>=12

  hours = hours%12 || 12

  const time = `${hours}:${minutes}${isPM ? ' pm':' am'}`

  return `${day}/${month}/${year},${time}`
}


export function debounce(func,limit){
  let timer;
  return function(...args){
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this,args);
    }, limit);
  }
}