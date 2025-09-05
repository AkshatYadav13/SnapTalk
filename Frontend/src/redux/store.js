import {  persistReducer,  FLUSH,  REHYDRATE,  PAUSE,  PERSIST,  PURGE,  REGISTER,} from "redux-persist";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";

import authSlice from './authSlice.js'
import postSlice from './postSlice.js'
import socketSlice from './socketSlice.js'
import chatSlice from './chatSlice.js'
import rtnSlice from "./rtnSlice.js";
  
  const persistConfig = {
    key: "root",
    version: 1,
    storage,
  };

  
  const rootReducer = combineReducers({
        auth:authSlice,
        chat:chatSlice,
        post:postSlice,
        socket:socketSlice,
        rtn:rtnSlice,
  })

  const persistedReducer = persistReducer(persistConfig, rootReducer);
    
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
  

export default store