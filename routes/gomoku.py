import sys
import json

# Constants for board state
EMPTY = 0
PLAYER = 1
OPPONENT = 2

def evaluate_line(line, player, opponent):
    count_player = line.count(player)
    count_opponent = line.count(opponent)
    
    if count_player > 0 and count_opponent > 0:
        return 0  # Blocked line

    score = 0
    if count_player == 5:
        score += 10000
    elif count_player == 4:
        score += 1000
    elif count_player == 3:
        score += 100
    elif count_player == 2:
        score += 10
    elif count_player == 1:
        score += 1

    if count_opponent == 5:
        score -= 10000
    elif count_opponent == 4:
        score -= 1000
    elif count_opponent == 3:
        score -= 100
    elif count_opponent == 2:
        score -= 10
    elif count_opponent == 1:
        score -= 1
        
    return score

def evaluate_board(board, player, opponent):
    score = 0
    rows = len(board)
    cols = len(board[0])

    # Horizontal lines
    for row in board:
        for i in range(cols - 4):
            line = row[i:i+5]
            score += evaluate_line(line, player, opponent)
    
    # Vertical lines
    for col in range(cols):
        for i in range(rows - 4):
            line = [board[i+j][col] for j in range(5)]
            score += evaluate_line(line, player, opponent)
    
    # Diagonal lines (bottom-right direction)
    for r in range(rows - 4):
        for c in range(cols - 4):
            line = [board[r+i][c+i] for i in range(5)]
            score += evaluate_line(line, player, opponent)
    
    # Diagonal lines (bottom-left direction)
    for r in range(rows - 4):
        for c in range(4, cols):
            line = [board[r+i][c-i] for i in range(5)]
            score += evaluate_line(line, player, opponent)
    
    return score

def find_best_move(board, player, opponent):
    rows = len(board)
    cols = len(board[0])
    best_score = -float('inf')
    best_move = None
    
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == EMPTY:
                board[r][c] = player
                score = evaluate_board(board, player, opponent)
                board[r][c] = EMPTY
                if score > best_score:
                    best_score = score
                    best_move = (r, c)
    
    if best_move is None:
        return {'error': 'No valid moves left'}
    
    return {'row': best_move[0], 'col': best_move[1]}

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        board = data['board']
        player = data['player']
        opponent = data['opponent']
        
        # Find the next move
        result = find_best_move(board, player, opponent)
        
        # Output the result as JSON
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == "__main__":
    main()
