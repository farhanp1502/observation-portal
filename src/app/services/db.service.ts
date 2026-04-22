import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private dbName = 'questionnairePlayer'
  private dbVersion = 1
  private storeName = 'questionnaire'
  private db!: IDBDatabase
  private dbInitialized: Promise<void>;

  constructor() {
    this.dbInitialized = this.initializeDb();
  }

  private initializeDb(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
  
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
  
      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
  
      request.onerror = (event: Event) => {
        console.error('Error opening database:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async addData(data: any) {
    await this.dbInitialized;
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    store.add(data);
  }

  async getData(key: any): Promise<any> {
    await this.dbInitialized;
  
    if (!key) {
    console.error("Invalid key passed to getData:", key);
    return null;
  }
  
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
  
        request.onsuccess = () => {
          resolve(request.result ?? null);
        };
  
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        console.error("IndexedDB transaction failed:", error);
        resolve(null);
      }
    });
  }
  

  updateData(data: any) {
    let downloadData:any = null;
    if(data.data.isDownload){
      downloadData = {
        keyid: data.key,
        data: {
          title : data.data.title,
          description : data.data.description,
          lastDownloadedAt : data.data.lastDownloadedAt,
          isDownload : data.data.isDownload
        }
      }
    }
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const request = store.put(data);
    request.onsuccess = (event) => {};
    request.onerror = (event) => {
      console.error('Error updating Data: ');
    };
    if(!downloadData) return
  }

  deleteData(key: any) {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const request = store.delete(key);

    request.onsuccess = (event) => {};

    request.onerror = (event) => {
      console.error('Error deleting item: ',);
    };
  }

  clearDb(){
    const transaction = this.db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    const request = store.clear();
    request.onsuccess = () => {};
    request.onerror = (event) => {
      console.error("Failed to clear db");
    }
  }
  async updateDB(updatedObservationData: any, submissionId: string) {
    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
  
      const dataToUpdate = {
        key: submissionId,
        data: updatedObservationData
      };
      const request = store.put(dataToUpdate);
      request.onsuccess = () => {
        console.log('Data updated successfully in IndexedDB');
      };
  
      request.onerror = (event: any) => {
        console.error('Error updating IndexedDB:', event.target.error);
      };
    } catch (error) {
      console.error('Failed to update IndexedDB:', error);
    }
  }

}