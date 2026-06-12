"""
Custom Heap Data Structure Implementation
Bu dosya, kelime analizi için özel tasarlanmış bir Max Heap yapısı içerir.
Heap, kelimeleri önce ilk harflerine (A-Z), sonra tekrar sayılarına göre sıralar.
"""

class WordNode:
    """
    Heap'te saklanacak kelime düğümü
    """
    def __init__(self, word, count=1):
        self.word = word.lower()  # Kelimeyi küçük harfe çevir
        self.count = count        # Tekrar sayısı
        self.first_letter = word[0].lower() if word else 'z'

    def __repr__(self):
        return f"WordNode('{self.word}', count={self.count})"


class CustomHeap:
    """
    Özel Max Heap implementasyonu
    Sıralama kuralları:
    1. İlk harfe göre A'dan Z'ye (alfabetik)
    2. Aynı harfle başlayanlar: En çok tekrar eden önce gelir
    """

    def __init__(self):
        self.heap = []      # Heap array'i
        self.word_map = {}  # Kelime -> index mapping (hızlı arama için)

    # ------------------------------------------------------------------ #
    #  Yardımcı index hesapları
    # ------------------------------------------------------------------ #

    def size(self):
        return len(self.heap)

    def is_empty(self):
        return len(self.heap) == 0

    def _parent_index(self, index):
        return (index - 1) // 2

    def _left_child_index(self, index):
        return 2 * index + 1

    def _right_child_index(self, index):
        return 2 * index + 2

    def _has_parent(self, index):
        return index > 0

    def _has_left_child(self, index):
        return self._left_child_index(index) < len(self.heap)

    def _has_right_child(self, index):
        return self._right_child_index(index) < len(self.heap)

    # ------------------------------------------------------------------ #
    #  Karşılaştırma ve Swap  (iki anahtar)
    # ------------------------------------------------------------------ #

    def _compare(self, node1, node2):
        """
        Return True  →  node1 daha öncelikli (heap'te üstte durmalı)

        Anahtar 1: ilk harf — küçük harf (A) daha öncelikli
        Anahtar 2: count    — büyük count daha öncelikli (aynı harf için)
        Anahtar 3: kelime   — alfabetik sıra (tiebreaker)
        """
        # Anahtar 1: İlk harf karşılaştırması (PRIMARY KEY)
        if node1.first_letter != node2.first_letter:
            return node1.first_letter < node2.first_letter
        
        # Anahtar 2: Aynı harfse, count karşılaştırması (SECONDARY KEY)
        if node1.count != node2.count:
            return node1.count > node2.count
        
        # Anahtar 3: Count ve harf aynıysa, kelimeyi alfabetik sırala
        return node1.word < node2.word

    def _swap(self, i, j):
        """İki elemanın yerini değiştir ve word_map'i güncelle."""
        self.word_map[self.heap[i].word] = j
        self.word_map[self.heap[j].word] = i
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]

    # ------------------------------------------------------------------ #
    #  Heapify
    # ------------------------------------------------------------------ #

    def heapify_up(self, index):
        """Yeni eklenen / güncellenen elemanı yukarı taşı."""
        while self._has_parent(index):
            parent_idx = self._parent_index(index)
            if self._compare(self.heap[index], self.heap[parent_idx]):
                self._swap(index, parent_idx)
                index = parent_idx
            else:
                break

    def heapify_down(self, index):
        """Root'tan başlayarak elemanı doğru konuma indir."""
        while self._has_left_child(index):
            best = self._left_child_index(index)
            right = self._right_child_index(index)

            if self._has_right_child(index) and self._compare(self.heap[right], self.heap[best]):
                best = right

            if self._compare(self.heap[index], self.heap[best]):
                break

            self._swap(index, best)
            index = best
    
    def rebuild_heap(self):
        """
        Heap'i tamamen yeniden inşa et (heapify from bottom up).
        Bu, tüm elemanlar eklendikten sonra heap property'yi garanti eder.
        """
        n = len(self.heap)
        # Son non-leaf node'dan başlayarak root'a kadar heapify_down yap
        for i in range(n // 2 - 1, -1, -1):
            self.heapify_down(i)
        
        # word_map'i yeniden oluştur
        self.word_map = {}
        for i, node in enumerate(self.heap):
            self.word_map[node.word] = i

    # ------------------------------------------------------------------ #
    #  Ekleme / Güncelleme
    # ------------------------------------------------------------------ #

    def insert(self, word):
        """
        Yeni kelime ekle veya mevcut kelimenin count'unu artır.
        Her kelime için heap güncellenir (ödev gereksinimi).
        """
        word_lower = word.lower()

        if word_lower in self.word_map:
            # Kelime zaten var → count artır, heap'i yeniden düzenle
            self._update_word(word_lower)
        else:
            # Yeni kelime → sona ekle, yukarı taşı
            new_node = WordNode(word_lower)
            self.heap.append(new_node)
            new_index = len(self.heap) - 1
            self.word_map[word_lower] = new_index
            self.heapify_up(new_index)

    def _update_word(self, word_lower):
        """Mevcut kelimenin count'unu artır ve heap'i düzelt."""
        index = self.word_map[word_lower]
        self.heap[index].count += 1
        # Count arttığı için sadece yukarı gitmesi gerekir
        self.heapify_up(index)

    # ------------------------------------------------------------------ #
    #  Çıkarma
    # ------------------------------------------------------------------ #

    def extract_max(self):
        """En öncelikli elemanı çıkar ve döndür."""
        if self.is_empty():
            return None

        max_node = self.heap[0]
        del self.word_map[max_node.word]

        if len(self.heap) == 1:
            self.heap.pop()
            return max_node

        last = self.heap.pop()
        self.heap[0] = last
        self.word_map[last.word] = 0
        self.heapify_down(0)

        return max_node

    # ------------------------------------------------------------------ #
    #  Sıralı liste (FIX: word_map yeniden inşa edilir)
    # ------------------------------------------------------------------ #

    def get_sorted_list(self):
        """
        Heap'teki tüm elemanları sıralı liste olarak döndür.
        NOT: Bu işlem heap'i boşaltır!
        """
        result = []
        while not self.is_empty():
            node = self.extract_max()
            result.append({
                'word': node.word,
                'count': node.count,
                'first_letter': node.first_letter
            })
        return result

    def get_all_words(self):
        """
        Tüm kelimeleri sıralı şekilde döndür (orijinal heap'i bozmadan).
        
        FIX: Deep copy yaparak heap'i kopyala ve extract_max ile sırala
        """
        import copy
        
        # Heap'in derin kopyasını oluştur
        temp_heap = CustomHeap()
        temp_heap.heap = [WordNode(node.word, node.count) for node in self.heap]
        temp_heap.word_map = {word: idx for word, idx in self.word_map.items()}
        
        # Heap property'yi kontrol et ve düzelt
        n = len(temp_heap.heap)
        for i in range(n // 2 - 1, -1, -1):
            temp_heap.heapify_down(i)
        
        # Extract max ile sıralı liste oluştur
        return temp_heap.get_sorted_list()

    # ------------------------------------------------------------------ #
    #  Yardımcı metodlar (Flask API için)
    # ------------------------------------------------------------------ #

    def peek(self):
        return self.heap[0] if not self.is_empty() else None

    def get_statistics(self):
        if self.is_empty():
            return {
                'total_words': 0,
                'unique_words': 0,
                'most_common': None,
                'total_occurrences': 0
            }
        total = sum(n.count for n in self.heap)
        most_common = max(self.heap, key=lambda x: x.count)
        return {
            'total_words': total,
            'unique_words': len(self.heap),
            'most_common': {'word': most_common.word, 'count': most_common.count},
            'total_occurrences': total
        }

    def get_heap_structure(self):
        structure = []
        for i, node in enumerate(self.heap):
            structure.append({
                'id': i,
                'word': node.word,
                'count': node.count,
                'first_letter': node.first_letter,
                'parent': self._parent_index(i) if self._has_parent(i) else None,
                'left_child': self._left_child_index(i) if self._has_left_child(i) else None,
                'right_child': self._right_child_index(i) if self._has_right_child(i) else None
            })
        return structure
