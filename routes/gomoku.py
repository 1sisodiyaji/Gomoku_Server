import sys
import json
import numpy as np
import time

BOARD_SIZE = 15

def create_board():
    return np.zeros((BOARD_SIZE, BOARD_SIZE), dtype=np.int8)

def check_winner(board, player):
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            if (col <= BOARD_SIZE - 5 and np.all(board[row, col:col+5] == player) or
                row <= BOARD_SIZE - 5 and np.all(board[row:row+5, col] == player) or
                row <= BOARD_SIZE - 5 and col <= BOARD_SIZE - 5 and np.all([board[row+i, col+i] == player for i in range(5)]) or
                row >= 4 and col <= BOARD_SIZE - 5 and np.all([board[row-i, col+i] == player for i in range(5)])):
                return True
    return False

def minimax(board, depth, alpha, beta, is_maximizing, player, opponent):
    if check_winner(board, player):
        return 1 if is_maximizing else -1
    elif check_winner(board, opponent):
        return -1 if is_maximizing else 1
    elif np.all(board != 0):
        return 0

    if is_maximizing:
        max_eval = -float('inf')
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                if board[row, col] == 0:
                    board[row, col] = player
                    eval = minimax(board, depth + 1, alpha, beta, False, player, opponent)
                    board[row, col] = 0
                    max_eval = max(max_eval, eval)
                    alpha = max(alpha, eval)
                    if beta <= alpha:
                        break
        return max_eval
    else:
        min_eval = float('inf')
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                if board[row, col] == 0:
                    board[row, col] = opponent
                    eval = minimax(board, depth + 1, alpha, beta, True, player, opponent)
                    board[row, col] = 0
                    min_eval = min(min_eval, eval)
                    beta = min(beta, eval)
                    if beta <= alpha:
                        break
        return min_eval

def best_move(board, player, opponent, max_depth=5, timeout=5):
    start_time = time.time()
    best_score = -float('inf')
    move = None
    for depth in range(1, max_depth + 1):
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                if board[row, col] == 0:
                    board[row, col] = player
                    score = minimax(board, 0, -float('inf'), float('inf'), False, player, opponent)
                    board[row, col] = 0
                    if score > best_score:
                        best_score = score
                        move = (row, col)
        if time.time() - start_time > timeout:
            break
    return move

if __name__ == '__main__':
    data = json.loads(sys.stdin.read())
    board = np.array(data['board'])
    player = data['player']
    opponent = data['opponent']
    move = best_move(board, player, opponent)
    board[move[0]][move[1]] = player
    winner = None
    if check_winner(board, player):
        winner = player
    elif check_winner(board, opponent):
        winner = opponent
    result = {
        'board': board.tolist(),
        'move': move,
        'winner': winner
    }
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()