CREATE POLICY "Users read own pixora images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pixora-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own pixora images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pixora-images' AND (storage.foldername(name))[1] = auth.uid()::text);